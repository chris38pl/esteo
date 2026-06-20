const PREFIX = "esteo.activation";

function key(suffix: string, workspaceSlug: string): string {
  return `${PREFIX}.${suffix}.${workspaceSlug}`;
}

export function notifyActivationStorageChanged(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("esteo:activation-storage-changed", {
      detail: { workspaceSlug },
    }),
  );
}

export function setWorkspaceReadyPending(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key("workspace-ready-pending", workspaceSlug), "1");
}

export function isWorkspaceReadyPending(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key("workspace-ready-pending", workspaceSlug)) === "1";
}

export function markWorkspaceReadySeen(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key("workspace-ready-pending", workspaceSlug));
  window.localStorage.setItem(key("workspace-ready-seen", workspaceSlug), "1");
}

export function isWorkspaceReadyBannerVisible(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return isWorkspaceReadyPending(workspaceSlug);
}

export function markFormLinkCopied(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key("form-link-copied", workspaceSlug), "1");
  notifyActivationStorageChanged(workspaceSlug);
}

export function isFormLinkCopied(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key("form-link-copied", workspaceSlug)) === "1";
}

export function markCelebrationDismissed(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key("celebration-dismissed", workspaceSlug), "1");
}

export function isCelebrationDismissed(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key("celebration-dismissed", workspaceSlug)) === "1";
}

export function markActivationCompletedAnalyticsFired(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key("completed-analytics-fired", workspaceSlug), "1");
}

export function hasActivationCompletedAnalyticsFired(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key("completed-analytics-fired", workspaceSlug)) === "1";
}

export function markPublicFormAnalyticsFired(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key("public-form-analytics-fired", workspaceSlug), "1");
}

export function hasPublicFormAnalyticsFired(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key("public-form-analytics-fired", workspaceSlug)) === "1";
}

export function markFirstAiToastShown(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key("first-ai-toast-shown", workspaceSlug), "1");
}

export function hasFirstAiToastShown(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key("first-ai-toast-shown", workspaceSlug)) === "1";
}

export function markFirstEstimateAnalyticsFired(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key("first-estimate-analytics-fired", workspaceSlug), "1");
}

export function hasFirstEstimateAnalyticsFired(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key("first-estimate-analytics-fired", workspaceSlug)) === "1";
}

export function markFirstPdfAnalyticsFired(workspaceSlug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key("first-pdf-analytics-fired", workspaceSlug), "1");
}

export function hasFirstPdfAnalyticsFired(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key("first-pdf-analytics-fired", workspaceSlug)) === "1";
}
