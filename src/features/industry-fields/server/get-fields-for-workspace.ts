import type { BusinessDocumentType, WorkspaceIndustry } from "@prisma/client";

import { prisma } from "@/db/client";
import { parseFieldSelectConfig } from "@/features/industry-fields/lib/field-select-config";
import type { SelectOption } from "@/features/industry-fields/schemas/definition";
import {
  listActiveFieldDefinitions,
  pickTranslation,
} from "@/features/industry-fields/server/repository";
import {
  filterIndustryFieldsForIntake,
  type IntakeSurface,
} from "@/features/workspaces/config/industry-intake-field-config";
import type { Locale } from "@/lib/locale";
import { appLocaleToWorkspaceLocale } from "@/lib/workspace-locale";

export type IndustryFieldForDocument = {
  id: string;
  key: string;
  valueType: string;
  required: boolean;
  sortOrder: number;
  label: string;
  description: string | null;
  placeholder: string | null;
  options: SelectOption[] | null;
};

export async function getIndustryFieldsForDocument(input: {
  workspaceId: string;
  documentType: BusinessDocumentType;
  locale: Locale;
  intakeSurface?: IntakeSurface;
}) {
  const workspace = await prisma.workspace.findFirst({
    where: { id: input.workspaceId, deletedAt: null },
    select: { industry: true },
  });

  if (!workspace) {
    return [];
  }

  const workspaceLocale = appLocaleToWorkspaceLocale(input.locale);
  const definitions = await listActiveFieldDefinitions({
    industry: workspace.industry,
    documentType: input.documentType,
  });

  const mapped = definitions.map((definition): IndustryFieldForDocument => {
    const translation =
      pickTranslation(definition.translations, workspaceLocale) ??
      pickTranslation(definition.translations, "EN") ??
      definition.translations[0];

    const rawOptions = definition.options;
    const selectConfig = parseFieldSelectConfig(rawOptions, definition.key);
    const optionsForField =
      selectConfig.choices.length > 0
        ? selectConfig.choices
        : ((rawOptions as SelectOption[] | null) ?? null);

    return {
      id: definition.id,
      key: definition.key,
      valueType: definition.valueType,
      required: definition.required,
      sortOrder: definition.sortOrder,
      label: translation?.label ?? definition.key,
      description: translation?.description ?? null,
      placeholder: translation?.placeholder ?? null,
      options: optionsForField,
    };
  });

  if (input.intakeSurface) {
    return filterIndustryFieldsForIntake(mapped, workspace.industry, input.intakeSurface);
  }

  return mapped;
}
