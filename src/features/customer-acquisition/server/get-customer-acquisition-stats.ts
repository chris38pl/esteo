"use server";

import { prisma } from "@/db/client";
import { formatFormConversionRate } from "@/features/customer-acquisition/lib/compute-form-conversion-rate";
import { viewerHasWorkspaceAccess } from "@/features/workspaces/server/workspace-access";
import type { Locale } from "@/lib/locale";
import { syncUserFromClerk } from "@/server/auth/sync-user";
import { mapDatabaseUnavailableActionError } from "@/server/db/mutation-action-errors";

const PUBLIC_FORM_SOURCE = "public_estimate_request_form";

export type CustomerAcquisitionStats = {
  visitCount: number;
  submissionCount: number;
  conversionRate: string;
};

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getCustomerAcquisitionStatsAction(input: {
  workspaceId: string;
  locale: Locale;
}): Promise<ActionResult<CustomerAcquisitionStats>> {
  try {
    const user = await syncUserFromClerk();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const hasAccess = await viewerHasWorkspaceAccess(user.id, input.workspaceId);
    if (!hasAccess) {
      return { success: false, error: "Forbidden." };
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: input.workspaceId, deletedAt: null },
      select: { publicFormVisitCount: true },
    });

    if (!workspace) {
      return { success: false, error: "Workspace not found." };
    }

    const submissionCount = await prisma.estimateRequest.count({
      where: {
        workspaceId: input.workspaceId,
        deletedAt: null,
        aiMetadata: {
          path: ["source"],
          equals: PUBLIC_FORM_SOURCE,
        },
      },
    });

    const visitCount = workspace.publicFormVisitCount;

    return {
      success: true,
      data: {
        visitCount,
        submissionCount,
        conversionRate: formatFormConversionRate(
          submissionCount,
          visitCount,
          input.locale,
        ),
      },
    };
  } catch (error) {
    const dbError = await mapDatabaseUnavailableActionError(error, input.locale);
    if (dbError) {
      return dbError;
    }
    throw error;
  }
}
