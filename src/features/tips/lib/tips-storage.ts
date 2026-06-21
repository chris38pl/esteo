import type { TipId } from "@/features/tips/lib/tips-catalog";

const PREFIX = "esteo.tips";
export const MAX_PINNED_TIPS = 3;

function scopedKey(suffix: string, userId: string, workspaceSlug: string): string {
  return `${PREFIX}.${suffix}.${userId}.${workspaceSlug}`;
}

export function notifyTipsStorageChanged(workspaceSlug: string, userId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent("esteo:tips-storage-changed", {
      detail: { workspaceSlug, userId },
    }),
  );
}

function readJsonArray(raw: string | null): TipId[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is TipId => typeof value === "string");
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, values: TipId[]): void {
  window.localStorage.setItem(key, JSON.stringify(values));
}

export function markTipsBannerDismissedForSession(userId: string, workspaceSlug: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(scopedKey("banner-dismissed", userId, workspaceSlug), "1");
  notifyTipsStorageChanged(workspaceSlug, userId);
}

export function isTipsBannerDismissedForSession(userId: string, workspaceSlug: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.sessionStorage.getItem(scopedKey("banner-dismissed", userId, workspaceSlug)) === "1"
  );
}

export function getDismissedTipIds(userId: string, workspaceSlug: string): TipId[] {
  if (typeof window === "undefined") {
    return [];
  }
  return readJsonArray(
    window.localStorage.getItem(scopedKey("dismissed-ids", userId, workspaceSlug)),
  );
}

export function isTipDismissed(userId: string, workspaceSlug: string, tipId: TipId): boolean {
  return getDismissedTipIds(userId, workspaceSlug).includes(tipId);
}

export function dismissTipForUser(userId: string, workspaceSlug: string, tipId: TipId): void {
  if (typeof window === "undefined") {
    return;
  }
  if (isTipPinned(userId, workspaceSlug, tipId)) {
    return;
  }
  const key = scopedKey("dismissed-ids", userId, workspaceSlug);
  const next = getDismissedTipIds(userId, workspaceSlug);
  if (next.includes(tipId)) {
    return;
  }
  writeJsonArray(key, [...next, tipId]);
  notifyTipsStorageChanged(workspaceSlug, userId);
}

export function getPinnedTipIds(userId: string, workspaceSlug: string): TipId[] {
  if (typeof window === "undefined") {
    return [];
  }
  return readJsonArray(
    window.localStorage.getItem(scopedKey("pinned-ids", userId, workspaceSlug)),
  ).slice(0, MAX_PINNED_TIPS);
}

export function isTipPinned(userId: string, workspaceSlug: string, tipId: TipId): boolean {
  return getPinnedTipIds(userId, workspaceSlug).includes(tipId);
}

export function pinTipForUser(
  userId: string,
  workspaceSlug: string,
  tipId: TipId,
): "pinned" | "max_reached" | "already_pinned" {
  if (typeof window === "undefined") {
    return "already_pinned";
  }

  const pinnedKey = scopedKey("pinned-ids", userId, workspaceSlug);
  const current = getPinnedTipIds(userId, workspaceSlug);

  if (current.includes(tipId)) {
    return "already_pinned";
  }
  if (current.length >= MAX_PINNED_TIPS) {
    return "max_reached";
  }

  writeJsonArray(pinnedKey, [...current, tipId]);

  const dismissedKey = scopedKey("dismissed-ids", userId, workspaceSlug);
  const dismissed = getDismissedTipIds(userId, workspaceSlug).filter((id) => id !== tipId);
  writeJsonArray(dismissedKey, dismissed);

  notifyTipsStorageChanged(workspaceSlug, userId);
  return "pinned";
}

export function unpinTipForUser(userId: string, workspaceSlug: string, tipId: TipId): void {
  if (typeof window === "undefined") {
    return;
  }
  const key = scopedKey("pinned-ids", userId, workspaceSlug);
  const next = getPinnedTipIds(userId, workspaceSlug).filter((id) => id !== tipId);
  writeJsonArray(key, next);
  notifyTipsStorageChanged(workspaceSlug, userId);
}

export type ToggleTipPinResult = "pinned" | "unpinned" | "max_reached";

export function toggleTipPin(
  userId: string,
  workspaceSlug: string,
  tipId: TipId,
): ToggleTipPinResult {
  if (isTipPinned(userId, workspaceSlug, tipId)) {
    unpinTipForUser(userId, workspaceSlug, tipId);
    return "unpinned";
  }

  const result = pinTipForUser(userId, workspaceSlug, tipId);
  if (result === "max_reached") {
    return "max_reached";
  }
  return "pinned";
}
