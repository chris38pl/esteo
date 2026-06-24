const PREFIX = "esteo.ai-setup-card.dismissed";

function storageKey(userId: string, workspaceSlug: string): string {
  return `${PREFIX}.${userId}.${workspaceSlug}`;
}

export function isAiSetupCardDismissed(userId: string, workspaceSlug: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(storageKey(userId, workspaceSlug)) === "1";
}

export function dismissAiSetupCard(userId: string, workspaceSlug: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(storageKey(userId, workspaceSlug), "1");
  window.dispatchEvent(
    new CustomEvent("esteo:ai-setup-card-dismissed", {
      detail: { userId, workspaceSlug },
    }),
  );
}
