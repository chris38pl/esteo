"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";
import type { ProposeEditResult } from "@/features/estimates/lib/estimate-agent-types";
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
  autoSaveVersion,
  createInternalEstimate,
  createNewVersion,
  proposeEdit,
  retryEstimateDraftGeneration,
  undoLastChange,
  updateEstimateTitle,
} from "./service";
import {
  addSectionToVersion,
  addLineItemToSection,
  archiveEstimateVersion,
  unarchiveEstimateVersion,
  deleteEstimateVersion,
  deleteLineItem,
  deleteSection,
  getVersionWithTree,
  reorderItems,
  type AutoSaveData,
} from "./repository";
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
    await requireAuth(locale);
    await archiveEstimateVersion({
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
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
    await requireAuth(locale);
    await unarchiveEstimateVersion({
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
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
    await requireAuth(locale);
    const result = await deleteEstimateVersion({
      estimateId: input.estimateId,
      versionId: input.versionId,
      workspaceId: input.workspaceId,
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
  try {
    const user = await requireAuth(input.locale ?? "pl");
    const result = await autoSaveVersion({
      versionId: input.versionId,
      workspaceId: input.workspaceId,
      userId: user.id,
      data: input.data,
      expectedUpdatedAt: new Date(input.expectedUpdatedAt),
    });

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
  try {
    await requireAuth(input.locale ?? "pl");
    const item = await addLineItemToSection({
      workspaceId: input.workspaceId,
      sectionId: input.sectionId,
    });
    return { success: true, data: { itemId: item.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteLineItemAction(input: {
  itemId: string;
  workspaceId: string;
  locale?: Locale;
}): Promise<ActionResult<void>> {
  try {
    await requireAuth(input.locale ?? "pl");
    await deleteLineItem(input.itemId, input.workspaceId);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
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
  ActionResult<{ requestStatus: string | null }>
> {
  try {
    await requireAuth(locale);
    const request = await prisma.estimateRequest.findFirst({
      where: { estimateId },
      select: { status: true },
    });
    return { success: true, data: { requestStatus: request?.status ?? null } };
  } catch (error) {
    return toActionError(error);
  }
}
