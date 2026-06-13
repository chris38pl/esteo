"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";
import type { ProposeEditResult } from "@/features/estimates/lib/estimate-agent-types";
import { computeEstimateDraftRecoveryFlags } from "@/features/estimates/lib/estimate-generation-stale";
import { prisma } from "@/db/client";
import type { Locale } from "@/lib/locale";
import {
  internalEstimateCreateSchema,
  type InternalEstimateCreateInput,
} from "@/features/estimate-requests/schemas/request";
import { requireAuth } from "@/server/auth/require-auth";
import { EntitlementError, PermissionError } from "@/server/permissions/errors";
import {
  serializeVersionWithTree,
  type VersionTreeClient,
} from "@/features/estimates/lib/serialize-estimate";
import { updateEstimateTitleSchema } from "@/features/estimates/schemas/estimate-title";
import {
  approveEdit,
  archiveEstimateVersion,
  autoSaveVersion,
  createInternalEstimate,
  createNewVersion,
  deleteEstimateVersion,
  proposeEdit,
  retryEstimateDraftGeneration,
  undoLastChange,
  unarchiveEstimateVersion,
  updateEstimateTitle,
} from "./service";
import {
  addSectionToVersion,
  addLineItemToSection,
  deleteLineItem,
  deleteSection,
  getVersionUpdatedAt,
  getVersionWithTree,
  patchLineItem,
  reorderItems,
  type AutoSaveData,
  type PatchLineItemData,
} from "./repository";
import { serverPerfEnd, serverPerfStart } from "@/features/estimates/lib/server-perf";
import { revalidateEstimatePaths } from "./revalidate-estimate-paths";

// ---------------------------------------------------------------------------
// Action result types
// ---------------------------------------------------------------------------

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError || error instanceof EntitlementError) {
    return { success: false, error: error.message };
  }
  console.error("[estimates action]", error);
  return { success: false, error: "Something went wrong." };
}

// ---------------------------------------------------------------------------
// Estimate creation
// ---------------------------------------------------------------------------

export async function createInternalEstimateAction(
  input: { workspaceId: string; locale?: Locale } & InternalEstimateCreateInput,
): Promise<ActionResult<{ estimateId: string }>> {
  try {
    const locale = input.locale ?? "pl";
    const { workspaceId, locale: _locale, ...body } = input;
    const parsed = internalEstimateCreateSchema.safeParse(body);

    if (!parsed.success) {
      return { success: false, error: "Invalid estimate request data." };
    }

    const user = await requireAuth(locale);
    const payload = parsed.data;

    const result = await createInternalEstimate({
      userId: user.id,
      workspaceId,
      locale,
      ...payload,
    });

    revalidatePath(`/${locale}/dashboard`);
    return { success: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Version management
// ---------------------------------------------------------------------------

export async function createNewVersionAction(input: {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale?: Locale;
}): Promise<ActionResult<{ versionId: string; versionNumber: number }>> {
  const locale = input.locale ?? "pl";
  try {
    const user = await requireAuth(locale);
    const result = await createNewVersion({
      estimateId: input.estimateId,
      workspaceId: input.workspaceId,
      userId: user.id,
    });
    revalidateEstimatePaths(locale, input.workspaceSlug, input.estimateId);
    return { success: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function archiveEstimateVersionAction(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale?: Locale;
}): Promise<ActionResult<void>> {
  const locale = input.locale ?? "pl";
  try {
    const user = await requireAuth(locale);
    await archiveEstimateVersion({
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
    });
    revalidateEstimatePaths(locale, input.workspaceSlug, input.estimateId);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function unarchiveEstimateVersionAction(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale?: Locale;
}): Promise<ActionResult<void>> {
  const locale = input.locale ?? "pl";
  try {
    const user = await requireAuth(locale);
    await unarchiveEstimateVersion({
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
    });
    revalidateEstimatePaths(locale, input.workspaceSlug, input.estimateId);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteEstimateVersionAction(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale?: Locale;
}): Promise<ActionResult<{ redirectVersionNumber: number }>> {
  const locale = input.locale ?? "pl";
  try {
    const user = await requireAuth(locale);
    const result = await deleteEstimateVersion({
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
    });
    revalidateEstimatePaths(locale, input.workspaceSlug, input.estimateId);
    return { success: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Estimate metadata
// ---------------------------------------------------------------------------

export async function updateEstimateTitleAction(input: {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  title: string;
  locale?: Locale;
}): Promise<ActionResult<{ title: string | null }>> {
  const locale = input.locale ?? "pl";
  try {
    const parsed = updateEstimateTitleSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid estimate title." };
    }

    const user = await requireAuth(locale);
    const result = await updateEstimateTitle(user, {
      estimateId: parsed.data.estimateId,
      workspaceId: parsed.data.workspaceId,
      title: parsed.data.title,
    });

    revalidateEstimatePaths(locale, parsed.data.workspaceSlug, parsed.data.estimateId);
    revalidatePath(`/${locale}/dashboard/${parsed.data.workspaceSlug}`, "layout");

    return { success: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Autosave
// ---------------------------------------------------------------------------

export async function autoSaveAction(input: {
  versionId: string;
  workspaceId: string;
  data: AutoSaveData;
  expectedUpdatedAt: string;
  locale?: Locale;
}): Promise<ActionResult<{ updatedAt: string; conflict: boolean }>> {
  serverPerfStart("autoSaveAction");
  try {
    serverPerfStart("autoSaveAction.requireAuth");
    const user = await requireAuth(input.locale ?? "pl");
    serverPerfEnd("autoSaveAction.requireAuth");

    serverPerfStart("autoSaveAction.autoSaveVersion");
    const result = await autoSaveVersion({
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
      data: input.data,
      expectedUpdatedAt: new Date(input.expectedUpdatedAt),
    });
    serverPerfEnd("autoSaveAction.autoSaveVersion");

    if (result.conflict) {
      return { success: true, data: { conflict: true, updatedAt: "" } };
    }

    return {
      success: true,
      data: {
        conflict: false,
        updatedAt: result.updatedAt!.toISOString(),
      },
    };
  } catch (error) {
    return toActionError(error);
  } finally {
    serverPerfEnd("autoSaveAction");
  }
}

export async function patchLineItemAction(input: {
  versionId: string;
  workspaceId: string;
  itemId: string;
  data: PatchLineItemData;
  sections: NonNullable<AutoSaveData["sections"]>;
  expectedUpdatedAt: string;
  locale?: Locale;
}): Promise<ActionResult<{ updatedAt: string; conflict: boolean }>> {
  serverPerfStart("patchLineItemAction");
  try {
    serverPerfStart("patchLineItemAction.requireAuth");
    await requireAuth(input.locale ?? "pl");
    serverPerfEnd("patchLineItemAction.requireAuth");

    serverPerfStart("patchLineItemAction.patchLineItem");
    const result = await patchLineItem({
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      itemId: input.itemId,
      data: input.data,
      sections: input.sections,
      expectedUpdatedAt: new Date(input.expectedUpdatedAt),
    });
    serverPerfEnd("patchLineItemAction.patchLineItem");

    if (result.conflict) {
      return { success: true, data: { conflict: true, updatedAt: "" } };
    }

    return {
      success: true,
      data: {
        conflict: false,
        updatedAt: result.updatedAt!.toISOString(),
      },
    };
  } catch (error) {
    return toActionError(error);
  } finally {
    serverPerfEnd("patchLineItemAction");
  }
}

export async function getVersionUpdatedAtAction(input: {
  versionId: string;
  workspaceId: string;
  locale?: Locale;
}): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    await requireAuth(input.locale ?? "pl");
    const updatedAt = await getVersionUpdatedAt(input.versionId, input.workspaceId);
    if (!updatedAt) {
      return { success: false, error: "Version not found." };
    }
    return { success: true, data: { updatedAt } };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Section / line item CRUD
// ---------------------------------------------------------------------------

export async function addSectionAction(input: {
  versionId: string;
  workspaceId: string;
  title?: string;
  locale?: Locale;
}): Promise<ActionResult<{ sectionId: string }>> {
  try {
    await requireAuth(input.locale ?? "pl");
    const section = await addSectionToVersion({
      workspaceId: input.workspaceId,
      versionId: input.versionId,
      title: input.title ?? "New section",
    });
    return { success: true, data: { sectionId: section.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function addLineItemAction(input: {
  sectionId: string;
  workspaceId: string;
  locale?: Locale;
}): Promise<ActionResult<{ itemId: string }>> {
  serverPerfStart("addLineItemAction");
  try {
    await requireAuth(input.locale ?? "pl");
    const item = await addLineItemToSection({
      workspaceId: input.workspaceId,
      sectionId: input.sectionId,
    });
    return { success: true, data: { itemId: item.id } };
  } catch (error) {
    return toActionError(error);
  } finally {
    serverPerfEnd("addLineItemAction");
  }
}

export async function deleteLineItemAction(input: {
  itemId: string;
  workspaceId: string;
  locale?: Locale;
}): Promise<ActionResult<void>> {
  serverPerfStart("deleteLineItemAction");
  try {
    await requireAuth(input.locale ?? "pl");
    await deleteLineItem(input.itemId, input.workspaceId);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  } finally {
    serverPerfEnd("deleteLineItemAction");
  }
}

export async function deleteSectionAction(input: {
  sectionId: string;
  workspaceId: string;
  locale?: Locale;
}): Promise<ActionResult<void>> {
  try {
    await requireAuth(input.locale ?? "pl");
    await deleteSection(input.sectionId, input.workspaceId);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderAction(input: {
  versionId: string;
  workspaceId: string;
  items: Array<{ id: string; sectionId: string; sortOrder: number }>;
  locale?: Locale;
}): Promise<ActionResult<void>> {
  try {
    await requireAuth(input.locale ?? "pl");
    await reorderItems(input.versionId, input.workspaceId, input.items);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// AI assistant
// ---------------------------------------------------------------------------

export async function proposeEditAction(input: {
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  estimateId: string;
  message: string;
  locale?: Locale;
}): Promise<ActionResult<ProposeEditResult>> {
  const locale = input.locale ?? "pl";
  try {
    const user = await requireAuth(locale);
    const result = await proposeEdit({
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
      message: input.message,
      locale,
    });
    return { success: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function approveEditAction(input: {
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  estimateId: string;
  patch: EstimateAgentPatch;
  locale?: Locale;
}): Promise<ActionResult<{ updatedAt: string; versionTree: VersionTreeClient | null }>> {
  const locale = input.locale ?? "pl";
  try {
    const user = await requireAuth(locale);
    const result = await approveEdit({
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
      patch: input.patch,
    });
    const rawTree = await getVersionWithTree(input.versionId, input.workspaceId);
    revalidateEstimatePaths(locale, input.workspaceSlug, input.estimateId);
    return {
      success: true,
      data: {
        updatedAt: result.updatedAt.toISOString(),
        versionTree: rawTree ? serializeVersionWithTree(rawTree) : null,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function undoChangeAction(input: {
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  estimateId: string;
  locale?: Locale;
}): Promise<ActionResult<{ updatedAt: string; versionTree: VersionTreeClient | null }>> {
  const locale = input.locale ?? "pl";
  try {
    const user = await requireAuth(locale);
    await undoLastChange({
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
    });
    const rawTree = await getVersionWithTree(input.versionId, input.workspaceId);
    const updatedAt = rawTree?.updatedAt.toISOString() ?? new Date().toISOString();
    revalidateEstimatePaths(locale, input.workspaceSlug, input.estimateId);
    return {
      success: true,
      data: {
        updatedAt,
        versionTree: rawTree ? serializeVersionWithTree(rawTree) : null,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Generation retry
// ---------------------------------------------------------------------------

export async function retryEstimateGenerationAction(input: {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale?: Locale;
}): Promise<ActionResult<void>> {
  const locale = input.locale ?? "pl";
  try {
    const user = await requireAuth(locale);
    await retryEstimateDraftGeneration({
      estimateId: input.estimateId,
      workspaceId: input.workspaceId,
      userId: user.id,
      locale,
    });
    revalidateEstimatePaths(locale, input.workspaceSlug, input.estimateId);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "GENERATION_NOT_RETRYABLE") {
        return { success: false, error: "Generation cannot be retried in its current state." };
      }
      if (error.message === "GENERATION_HAS_SECTIONS") {
        return {
          success: false,
          error: "Cannot retry AI generation when the estimate already has sections.",
        };
      }
      if (error.message === "GENERATION_ACTIVE") {
        return {
          success: false,
          error: "Generation is still in progress. Wait a moment and try again.",
        };
      }
    }
    return toActionError(error);
  }
}

// ---------------------------------------------------------------------------
// Generation status polling
// ---------------------------------------------------------------------------

export async function getGenerationStatusAction(
  estimateId: string,
  locale: Locale = "pl",
): Promise<
  ActionResult<{
    requestStatus: string | null;
    sectionCount: number;
    isStale: boolean;
    canManualRetry: boolean;
  }>
> {
  try {
    await requireAuth(locale);
    const estimate = await prisma.estimate.findFirst({
      where: { id: estimateId, deletedAt: null },
      select: {
        latestVersion: {
          select: {
            id: true,
            status: true,
            _count: {
              select: {
                sections: { where: { deletedAt: null } },
              },
            },
          },
        },
        estimateRequest: {
          select: { status: true, updatedAt: true },
        },
      },
    });

    if (!estimate) {
      return { success: true, data: { requestStatus: null, sectionCount: 0, isStale: false, canManualRetry: false } };
    }

    const sectionCount = estimate.latestVersion?._count.sections ?? 0;
    const request = estimate.estimateRequest;
    const requestUpdatedAt = request?.updatedAt ?? new Date(0);

    const recoveryFlags = computeEstimateDraftRecoveryFlags({
      hasEstimateRequest: request != null,
      status: request?.status,
      sectionCount,
      versionStatus: estimate.latestVersion?.status,
      updatedAt: requestUpdatedAt,
    });

    return {
      success: true,
      data: {
        requestStatus: request?.status ?? null,
        sectionCount,
        isStale: recoveryFlags.isStale,
        canManualRetry: recoveryFlags.canManualRetryAiDraft,
      },
    };
  } catch (error) {
    return toActionError(error);
  }
}
