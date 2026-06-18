import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import type { WorkspaceIndustry } from "@prisma/client";
import type { Locale } from "@/lib/locale";

const WORK_TYPE_PREFIX: Record<Locale, string> = {
  pl: "Wykończenie",
  en: "Finishing",
};

function fieldReady<T>(confidence: number, value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== "" && confidence >= 0.5;
}

export function buildTitleFromExtraction(
  extraction: VoiceIntakeExtraction,
  locale: Locale,
  industry: WorkspaceIndustry = "CONSTRUCTION",
): string {
  if (isServiceWorkspace(industry)) {
    const generated = extraction.generatedTitle.value?.trim();
    if (fieldReady(extraction.generatedTitle.confidence, generated)) {
      return generated.length <= 60 ? generated : generated.slice(0, 60).trimEnd();
    }

    const scopeItem = extraction.scopeOfWork.items[0]?.label?.trim();
    if (scopeItem) {
      const title = scopeItem.length <= 60 ? scopeItem : scopeItem.slice(0, 60).trimEnd();
      return title;
    }

    return "";
  }

  const parts: string[] = [];

  if (fieldReady(extraction.propertyType.confidence, extraction.propertyType.value)) {
    const label = getIndustryOptionLabel(
      "property_type",
      extraction.propertyType.value,
      locale,
      "label",
    );
    parts.push(`${WORK_TYPE_PREFIX[locale]} ${label.toLowerCase()}`);
  }

  if (fieldReady(extraction.area.confidence, extraction.area.value)) {
    parts.push(`${extraction.area.value} m²`);
  }

  if (fieldReady(extraction.city.confidence, extraction.city.value)) {
    const city = extraction.city.value;
    parts.push(locale === "pl" ? `w ${city}` : `in ${city}`);
  }

  const title = parts.join(" ").trim();
  if (!title) return "";

  return title.length <= 60 ? title : title.slice(0, 60).trimEnd();
}
