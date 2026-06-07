/** Derives the thumbnail storage key from an existing original key. */
export function buildThumbnailStorageKeyFromOriginal(originalStorageKey: string): string {
  const marker = "/original-";

  if (originalStorageKey.includes(marker)) {
    return originalStorageKey.replace(marker, "/thumb-");
  }

  return `${originalStorageKey.replace(/\/original(\.|$)/, "/thumb$1")}`;
}
