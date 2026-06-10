/** Maximum raw upload size for workspace logo. */
export const MAX_LOGO_RAW_BYTES = 2 * 1024 * 1024;

/** Max dimension (longest side) after processing. */
export const MAX_LOGO_DIMENSION_PX = 512;

/** Target max stored size before optional quality reduction (JPEG/WebP). */
export const MAX_LOGO_STORED_BYTES = 300 * 1024;

export const ALLOWED_LOGO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedLogoMimeType = (typeof ALLOWED_LOGO_MIME_TYPES)[number];

export const LOGO_ACCEPT_TYPES = ALLOWED_LOGO_MIME_TYPES.join(",");

export function isAllowedLogoMimeType(mimeType: string): mimeType is AllowedLogoMimeType {
  return (ALLOWED_LOGO_MIME_TYPES as readonly string[]).includes(mimeType);
}
