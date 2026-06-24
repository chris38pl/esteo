export const AI_SETUP_FOCUS_PARAM = "focus";

export type AiSetupFocusField =
  | "businessType"
  | "companyDescription"
  | "estimateRules"
  | "estimateSections";

export const AI_SETUP_FOCUS_FIELD_IDS: Record<AiSetupFocusField, string> = {
  businessType: "workspace-business-type",
  companyDescription: "workspace-settings-company-description",
  estimateRules: "workspace-estimate-rules-add",
  estimateSections: "workspace-estimate-sections-panel",
};

export function isAiSetupFocusField(value: string | null): value is AiSetupFocusField {
  return (
    value === "businessType" ||
    value === "companyDescription" ||
    value === "estimateRules" ||
    value === "estimateSections"
  );
}

export function aiSetupFocusHref(
  basePath: string,
  focus: AiSetupFocusField,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams(extraParams);
  params.set(AI_SETUP_FOCUS_PARAM, focus);
  return `${basePath}?${params.toString()}`;
}
