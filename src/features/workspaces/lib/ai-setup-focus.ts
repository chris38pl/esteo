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

const SCROLL_ONLY_FIELDS = new Set<AiSetupFocusField>(["estimateSections"]);

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
  const queryIndex = basePath.indexOf("?");
  const pathname = queryIndex === -1 ? basePath : basePath.slice(0, queryIndex);
  const params = new URLSearchParams(queryIndex === -1 ? "" : basePath.slice(queryIndex + 1));

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, value);
    }
  }

  params.set(AI_SETUP_FOCUS_PARAM, focus);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function findAiSetupFocusTarget(focus: AiSetupFocusField): HTMLElement | null {
  const id = AI_SETUP_FOCUS_FIELD_IDS[focus];
  const byId = document.getElementById(id);
  if (byId) {
    return byId;
  }
  return document.querySelector<HTMLElement>(`[data-ai-setup-field="${focus}"]`);
}

export function applyAiSetupFieldFocus(
  focus: AiSetupFocusField,
  options?: { highlightClass?: string; highlightMs?: number },
): boolean {
  const target = findAiSetupFocusTarget(focus);
  if (!target) {
    return false;
  }

  const highlightClass = options?.highlightClass ?? "ai-setup-focus-active";
  const highlightMs = options?.highlightMs ?? 4_000;

  target.scrollIntoView({
    behavior: "smooth",
    block: focus === "estimateSections" ? "start" : "center",
  });
  target.classList.add(highlightClass);

  if (!SCROLL_ONLY_FIELDS.has(focus)) {
    const focusable =
      target.matches("input, textarea, button, select")
        ? target
        : target.querySelector<HTMLElement>("input, textarea, button, select");
    focusable?.focus({ preventScroll: true });
  }

  window.setTimeout(() => {
    target.classList.remove(highlightClass);
  }, highlightMs);

  return true;
}
