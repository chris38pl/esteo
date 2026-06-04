"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";
import type { ProposeEditResult } from "@/features/estimates/lib/estimate-agent-types";
import { prisma } from "@/db/client";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { EntitlementError, PermissionError } from "@/server/permissions/errors";
import {
  serializeVersionWithTree,
  type VersionTreeClient,
} from "@/features/estimates/lib/serialize-estimate";
import {
  approveEdit,
  autoSaveVersion,
  createInternalEstimate,
  createNewVersion,
  proposeEdit,
  undoLastChange,
} from "./service";
import {
  addSectionToVersion,
  addLineItemToSection,
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

export async function createInternalEstimateAction(input: {
  title?: string;
  projectDescription: string;
  workspaceId: string;
  locale?: Locale;
}): Promise<ActionResult<{ estimateId: string }>> {
  try {
    const user = await requireAuth(input.locale ?? "pl");
    const result = await createInternalEstimate({
      userId: user.id,
      workspaceId: input.workspaceId,
      title: input.title,
      projectDescription: input.projectDescription,
      locale: input.locale ?? "pl",
    });
    revalidatePath(`/${input.locale ?? "pl"}/dashboard`);
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
  locale?: Locale;
}): Promise<ActionResult<void>> {
  try {
    await requireAuth(input.locale ?? "pl");
    await deleteLineItem(input.itemId);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteSectionAction(input: {
  sectionId: string;
  locale?: Locale;
}): Promise<ActionResult<void>> {
  try {
    await requireAuth(input.locale ?? "pl");
    await deleteSection(input.sectionId);
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
