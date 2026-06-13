/** Max display dimensions for PDF-embedded images (2× CSS size for sharp print). */

export const PDF_HERO_IMAGE_TARGET = {
  maxWidth: 480,
  maxHeight: 256,
  format: "jpeg" as const,
  quality: 82,
};

export const PDF_WORKSPACE_LOGO_TARGET = {
  maxWidth: 280,
  maxHeight: 96,
  quality: 82,
};

export const PDF_ESTEO_PROMO_LOGO_TARGET = {
  maxWidth: 80,
  maxHeight: 80,
  format: "png" as const,
  quality: 82,
};

export const PDF_ESTEO_PROMO_ILLUSTRATION_TARGET = {
  maxWidth: 220,
  maxHeight: 140,
  format: "jpeg" as const,
  quality: 82,
};
