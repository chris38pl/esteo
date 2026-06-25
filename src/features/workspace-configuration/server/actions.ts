"use server";

import { revalidatePath } from "next/cache";
import { estimateTemplateInputSchema } from "@/features/estimate-templates/schemas/estimate-template";
import {
  generateTemplateFromPrompt,
  TemplateGenerationError,
} from "@/features/estimate-templates/server/generate-template-from-prompt";
import type { TemplateGenerationMode } from "@/ai/prompts/template-generation";
import { EstimateImportEmptyStructureError } from "@/features/estimate-templates/lib/estimate-to-template-draft";
import {
  importTemplateFromEstimate,
  listEstimatesForTemplateImport,
} from "@/features/estimate-templates/server/import-template-from-estimate";
import type { EstimateImportListItem } from "@/features/estimate-templates/types/estimate-import";
import { priceListInputSchema } from "@/features/price-lists/schemas/price-list";
import {
  createEstimateTemplate,
  createPriceList,
  deleteEstimateTemplate,
  deletePriceList,
  serializePriceList,
  serializeTemplate,
  setDefaultEstimateTemplate,
  setDefaultPriceList,
  updateEstimateTemplate,
  updatePriceList,
} from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import {
  EntitlementError,
  PermissionError,
  WorkspaceError,
} from "@/server/permissions/errors";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof EntitlementError) {
    return { success: false, error: error.message, code: error.code };
  }

  if (error instanceof PermissionError || error instanceof WorkspaceError) {
    return { success: false, error: error.message };
  }

  console.error("[workspace configuration action]", error);
  return { success: false, error: "Something went wrong." };
}

function revalidateConfiguration(locale: Locale, workspaceSlug: string) {
  revalidatePath(`/${locale}/dashboard/${workspaceSlug}/configuration`);
  revalidatePath(`/${locale}/dashboard/${workspaceSlug}/settings`);
}

function revalidateTemplateEditor(
  locale: Locale,
  workspaceSlug: string,
  templateId?: string,
) {
  revalidateConfiguration(locale, workspaceSlug);
  revalidatePath(`/${locale}/dashboard/${workspaceSlug}/configuration/templates/new`);
  if (templateId) {
    revalidatePath(`/${locale}/dashboard/${workspaceSlug}/configuration/templates/${templateId}`);
  }
}

function revalidatePriceListEditor(
  locale: Locale,
  workspaceSlug: string,
  priceListId?: string,
) {
  revalidateConfiguration(locale, workspaceSlug);
  revalidatePath(`/${locale}/dashboard/${workspaceSlug}/configuration/price-lists/new`);
  if (priceListId) {
    revalidatePath(`/${locale}/dashboard/${workspaceSlug}/configuration/price-lists/${priceListId}`);
  }
}

export async function createEstimateTemplateAction(
  input: {
    workspaceId: string;
    workspaceSlug: string;
    template: unknown;
  },
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const parsed = estimateTemplateInputSchema.parse(input.template);
    const template = await createEstimateTemplate(user, input.workspaceId, parsed);
    revalidateTemplateEditor(locale, input.workspaceSlug, template.id);
    return { success: true as const, data: serializeTemplate(template) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateEstimateTemplateAction(
  input: {
    workspaceId: string;
    workspaceSlug: string;
    templateId: string;
    template: unknown;
  },
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const parsed = estimateTemplateInputSchema.parse(input.template);
    const template = await updateEstimateTemplate(
      user,
      input.workspaceId,
      input.templateId,
      parsed,
    );
    revalidateTemplateEditor(locale, input.workspaceSlug, input.templateId);
    return { success: true as const, data: serializeTemplate(template) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteEstimateTemplateAction(
  input: {
    workspaceId: string;
    workspaceSlug: string;
    templateId: string;
  },
  locale: Locale = "pl",
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth(locale);
    await deleteEstimateTemplate(user, input.workspaceId, input.templateId);
    revalidateConfiguration(locale, input.workspaceSlug);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setDefaultEstimateTemplateAction(
  input: {
    workspaceId: string;
    workspaceSlug: string;
    templateId: string | null;
    /** Revalidate template editor page when clearing default from a specific template. */
    revalidateTemplateId?: string;
  },
  locale: Locale = "pl",
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth(locale);
    await setDefaultEstimateTemplate(user, input.workspaceId, input.templateId);
    revalidateTemplateEditor(
      locale,
      input.workspaceSlug,
      input.revalidateTemplateId ?? input.templateId ?? undefined,
    );
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createPriceListAction(
  input: {
    workspaceId: string;
    workspaceSlug: string;
    priceList: unknown;
  },
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const parsed = priceListInputSchema.parse(input.priceList);
    const priceList = await createPriceList(user, input.workspaceId, parsed);
    revalidatePriceListEditor(locale, input.workspaceSlug, priceList.id);
    return { success: true as const, data: serializePriceList(priceList) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updatePriceListAction(
  input: {
    workspaceId: string;
    workspaceSlug: string;
    priceListId: string;
    priceList: unknown;
  },
  locale: Locale = "pl",
) {
  try {
    const user = await requireAuth(locale);
    const parsed = priceListInputSchema.parse(input.priceList);
    const priceList = await updatePriceList(
      user,
      input.workspaceId,
      input.priceListId,
      parsed,
    );
    revalidatePriceListEditor(locale, input.workspaceSlug, input.priceListId);
    return { success: true as const, data: serializePriceList(priceList) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deletePriceListAction(
  input: {
    workspaceId: string;
    workspaceSlug: string;
    priceListId: string;
  },
  locale: Locale = "pl",
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth(locale);
    await deletePriceList(user, input.workspaceId, input.priceListId);
    revalidateConfiguration(locale, input.workspaceSlug);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setDefaultPriceListAction(
  input: {
    workspaceId: string;
    workspaceSlug: string;
    priceListId: string | null;
  },
  locale: Locale = "pl",
): Promise<ActionResult<void>> {
  try {
    const user = await requireAuth(locale);
    await setDefaultPriceList(user, input.workspaceId, input.priceListId);
    revalidateConfiguration(locale, input.workspaceSlug);
    return { success: true, data: undefined };
  } catch (error) {
    return toActionError(error);
  }
}

export async function generateTemplateFromPromptAction(
  input: {
    workspaceId: string;
    userOutline: string;
    generationMode: TemplateGenerationMode;
  },
  locale: Locale = "pl",
): Promise<
  ActionResult<{
    name: string;
    description: string;
    sections: Array<{
      id: string;
      title: string;
      guidance: string;
      sortOrder: number;
      items: Array<{
        id: string;
        name: string;
        unit: string;
        sortOrder: number;
      }>;
    }>;
  }>
> {
  try {
    const user = await requireAuth(locale);
    const draft = await generateTemplateFromPrompt({
      user,
      workspaceId: input.workspaceId,
      userOutline: input.userOutline,
      generationMode: input.generationMode,
      locale,
    });
    return { success: true, data: draft };
  } catch (error) {
    if (error instanceof TemplateGenerationError) {
      return { success: false, error: error.message, code: error.code };
    }
    return toActionError(error);
  }
}

export async function listEstimatesForTemplateImportAction(
  input: { workspaceId: string },
  locale: Locale = "pl",
): Promise<ActionResult<EstimateImportListItem[]>> {
  try {
    await requireAuth(locale);
    const estimates = await listEstimatesForTemplateImport(input.workspaceId, locale);
    return { success: true, data: estimates };
  } catch (error) {
    return toActionError(error);
  }
}

export async function importTemplateFromEstimateAction(
  input: {
    workspaceId: string;
    workspaceSlug: string;
    estimateId: string;
    name: string;
    description?: string;
  },
  locale: Locale = "pl",
): Promise<ActionResult<{ templateId: string }>> {
  try {
    const user = await requireAuth(locale);
    const result = await importTemplateFromEstimate(user, {
      workspaceId: input.workspaceId,
      estimateId: input.estimateId,
      name: input.name,
      description: input.description,
    });
    revalidateTemplateEditor(locale, input.workspaceSlug, result.templateId);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof EstimateImportEmptyStructureError) {
      return { success: false, error: error.message, code: "EMPTY_STRUCTURE" };
    }
    return toActionError(error);
  }
}
