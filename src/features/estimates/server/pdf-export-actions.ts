"use server";

import "server-only";

import { EstimatePdfStatus } from "@prisma/client";
import { runs, tasks } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import { getEstimatePdfDownloadUrl } from "@/features/estimates/server/estimate-pdf-download-service";
import {
  findEstimatePdfByVersionId,
  upsertEstimatePdfExportPending,
} from "@/features/estimates/server/estimate-pdf-repository";
import { isEstimatePdfFresh } from "@/features/estimates/server/pdf-export-service";
import {
  createEstimatePdfId,
  needsEstimatePdfStorageHeal,
} from "@/features/estimates/server/pdf-storage-service";
import { revalidateEstimatePaths } from "@/features/estimates/server/revalidate-estimate-paths";
import { assertEstimateInWorkspace } from "@/features/estimates/server/notes-repository";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";
import type { generateEstimatePdfTask } from "@/trigger/generate-estimate-pdf";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }

  console.error("[pdf-export action]", error);
  return { success: false, error: "Something went wrong." };
}

function isReadyForDownload(
  existing: NonNullable<Awaited<ReturnType<typeof findEstimatePdfByVersionId>>>,
  workspaceId: string,
  versionUpdatedAt: Date,
  requestLocale: Locale,
): boolean {
  return (
    existing.status === EstimatePdfStatus.READY &&
    !needsEstimatePdfStorageHeal(existing, workspaceId, existing.id) &&
    isEstimatePdfFresh({
      generatedAt: existing.generatedAt,
      versionUpdatedAt,
      generatedLocale: existing.generatedLocale,
      requestLocale,
    })
  );
}

export async function exportEstimatePdfAction(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}): Promise<
  ActionResult<
    | {
        status: "ready";
        url: string;
        fileName: string;
        viewerTitle: string;
        estimatePdfId: string;
        cached: boolean;
      }
    | { status: "generating"; runId: string }
  >
> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "MEMBER");
    await assertEstimateInWorkspace(input.estimateId, input.workspaceId);

    const version = await prisma.estimateVersion.findFirst({
      where: {
        id: input.versionId,
        estimateId: input.estimateId,
        workspaceId: input.workspaceId,
      },
      select: { id: true, updatedAt: true },
    });

    if (!version) {
      return { success: false, error: "Version not found." };
    }

    const existing = await findEstimatePdfByVersionId(input.versionId);

    if (existing && isReadyForDownload(existing, input.workspaceId, version.updatedAt, input.locale)) {
      const download = await getEstimatePdfDownloadUrl({
        estimatePdfId: existing.id,
        workspaceId: input.workspaceId,
        user,
        locale: input.locale,
      });

      revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

      return {
        success: true,
        data: {
          status: "ready",
          url: download.url,
          fileName: download.fileName,
          viewerTitle: download.viewerTitle,
          estimatePdfId: existing.id,
          cached: true,
        },
      };
    }

    const estimatePdfId = existing?.id ?? createEstimatePdfId();

    await upsertEstimatePdfExportPending({
      id: estimatePdfId,
      estimateId: input.estimateId,
      versionId: input.versionId,
      createdById: user.id,
    });

    const handle = await tasks.trigger<typeof generateEstimatePdfTask>("generate-estimate-pdf", {
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      locale: input.locale,
      userId: user.id,
    });

    return {
      success: true,
      data: { status: "generating", runId: handle.id },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function pollEstimatePdfExportAction(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  runId?: string;
}): Promise<
  ActionResult<
    | { status: "pending" }
    | { status: "ready"; url: string; fileName: string; viewerTitle: string; estimatePdfId: string }
    | { status: "failed"; errorMessage?: string }
  >
> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "VIEWER");
    await assertEstimateInWorkspace(input.estimateId, input.workspaceId);

    if (input.runId) {
      const run = await runs.retrieve<typeof generateEstimatePdfTask>(input.runId);

      if (run.isFailed) {
        return {
          success: true,
          data: {
            status: "failed",
            errorMessage: run.error?.message,
          },
        };
      }
    }

    const version = await prisma.estimateVersion.findFirst({
      where: {
        id: input.versionId,
        estimateId: input.estimateId,
        workspaceId: input.workspaceId,
      },
      select: { updatedAt: true },
    });

    if (!version) {
      return { success: false, error: "Version not found." };
    }

    const existing = await findEstimatePdfByVersionId(input.versionId);

    if (!existing) {
      return { success: true, data: { status: "pending" } };
    }

    if (existing.status === EstimatePdfStatus.FAILED) {
      return {
        success: true,
        data: {
          status: "failed",
          errorMessage: existing.errorMessage ?? undefined,
        },
      };
    }

    if (isReadyForDownload(existing, input.workspaceId, version.updatedAt, input.locale)) {
      const download = await getEstimatePdfDownloadUrl({
        estimatePdfId: existing.id,
        workspaceId: input.workspaceId,
        user,
        locale: input.locale,
      });

      revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

      return {
        success: true,
        data: {
          status: "ready",
          url: download.url,
          fileName: download.fileName,
          viewerTitle: download.viewerTitle,
          estimatePdfId: existing.id,
        },
      };
    }

    return { success: true, data: { status: "pending" } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getEstimatePdfDownloadUrlAction(input: {
  estimatePdfId: string;
  estimateId: string;
  workspaceId: string;
  locale: Locale;
}): Promise<ActionResult<{ url: string; fileName: string; viewerTitle: string }>> {
  try {
    const user = await requireAuth(input.locale);
    await requireRole(user, input.workspaceId, "VIEWER");
    await assertEstimateInWorkspace(input.estimateId, input.workspaceId);

    const download = await getEstimatePdfDownloadUrl({
      estimatePdfId: input.estimatePdfId,
      workspaceId: input.workspaceId,
      user,
      locale: input.locale,
    });

    return { success: true, data: download };
  } catch (error) {
    return toActionError(error);
  }
}
