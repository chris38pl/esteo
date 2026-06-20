/** Staging attachments expire 24h after creation (submit + cleanup). */
export const STAGING_ATTACHMENT_TTL_MS = 24 * 60 * 60 * 1000;

/** Zombie UPLOADING rows without blob are removed after 1h without activity. */
export const STAGING_ZOMBIE_UPLOADING_MS = 60 * 60 * 1000;

export function isStagingExpired(createdAt: Date, now = Date.now()): boolean {
  return createdAt.getTime() < now - STAGING_ATTACHMENT_TTL_MS;
}

export function isStagingUploadingZombie(updatedAt: Date, now = Date.now()): boolean {
  return updatedAt.getTime() < now - STAGING_ZOMBIE_UPLOADING_MS;
}
