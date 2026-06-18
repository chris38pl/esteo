"use server";

import "server-only";

import { EstimateSendTransportStatus } from "@prisma/client";
import { runs } from "@trigger.dev/sdk";

import { enqueueEstimateSend } from "@/features/estimates/server/enqueue-estimate-send";
import {
  acceptEstimateVersion,
  rejectEstimateVersion,
  reopenEstimateVersion,
} from "@/features/estimates/server/estimate-workflow-service";
import { findSendAttemptById } from "@/features/estimates/server/get-estimate-send-attempts";
import { updateSendTransportStatus } from "@/features/estimates/server/process-estimate-send-attempt";
import { revalidateEstimatePaths } from "@/features/estimates/server/revalidate-estimate-paths";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";
import type { sendEstimateToCustomerTask } from "@/trigger/send-estimate-to-customer";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }

  console.error("[estimate-send action]", error);
  return { success: false, error: "Something went wrong." };
}

const TERMINAL_SEND_STATUSES: EstimateSendTransportStatus[] = [
  "PROVIDER_ACCEPTED",
  "DELIVERED",
  "FAILED",
];

export async function sendEstimateToCustomerAction(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  sentToEmail: string;
  attachPdf: boolean;
  isResend?: boolean;
  activityNote?: string;
}): Promise<ActionResult<{ sendId: string; runId: string }>> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "MEMBER");

    const result = await enqueueEstimateSend({
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
      userEmail: user.email,
      sentToEmail: input.sentToEmail,
      attachPdf: input.attachPdf,
      isResend: input.isResend ?? false,
      activityNote: input.activityNote,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return { success: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function pollEstimateSendAction(input: {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  sendId: string;
  runId?: string;
}): Promise<
  ActionResult<
    | { status: "pending"; transportStatus: EstimateSendTransportStatus }
    | { status: "completed"; transportStatus: EstimateSendTransportStatus }
    | { status: "failed"; errorMessage?: string }
  >
> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "VIEWER");

    const send = await findSendAttemptById(input.sendId, input.workspaceId);
    if (!send) {
      return { success: false, error: "Send attempt not found." };
    }

    if (TERMINAL_SEND_STATUSES.includes(send.transportStatus)) {
      revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

      if (send.transportStatus === "FAILED") {
        return {
          success: true,
          data: {
            status: "failed",
            errorMessage: send.errorMessage ?? undefined,
          },
        };
      }

      return {
        success: true,
        data: {
          status: "completed",
          transportStatus: send.transportStatus,
        },
      };
    }

    if (input.runId) {
      const run = await runs.retrieve<typeof sendEstimateToCustomerTask>(input.runId);
      if (run.isFailed) {
        const errorMessage = run.error?.message ?? "Send failed.";
        await updateSendTransportStatus(send.id, "FAILED", { errorMessage });
        revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

        return {
          success: true,
          data: {
            status: "failed",
            errorMessage,
          },
        };
      }
    }

    return {
      success: true,
      data: {
        status: "pending",
        transportStatus: send.transportStatus,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function acceptEstimateVersionAction(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  note?: string;
}): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "MEMBER");

    await acceptEstimateVersion({
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
      note: input.note,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function rejectEstimateVersionAction(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  note?: string;
}): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "MEMBER");

    await rejectEstimateVersion({
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
      note: input.note,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reopenEstimateVersionAction(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  note?: string;
}): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "MEMBER");

    await reopenEstimateVersion({
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
      note: input.note,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}
