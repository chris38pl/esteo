/** Fine-tune glow center when the WebP content is optically off-center. */
export const VOICE_RECORDING_GLOW_OFFSET = {
  x: -3,
  y: 22,
} as const;

/** Summary (Podsumowanie) hero - public/images/voice-intake/understand-your-project.webp */
export const VOICE_SUMMARY_HERO_IMAGE = "/images/voice-intake/understand-your-project.webp";

/** Error screen owl - public/images/voice-intake/error-owl-{light,dark}.webp */
export const VOICE_ERROR_OWL_IMAGES = {
  light: "/images/voice-intake/error-owl-light.webp",
  dark: "/images/voice-intake/error-owl-dark.webp",
} as const;

/** Public folder: public/images/voice-intake/ */
export const VOICE_RECORDING_GLOW_IMAGES = {
  dark: "/images/voice-intake/recording-glow-dark.webp",
  light: "/images/voice-intake/recording-glow-light.webp",
  /** Generic single file (also used when only dark/light is uploaded). */
  fallback: "/images/voice-intake/recording-glow.webp",
} as const;

/** Preferred src per theme; later entries are fallbacks when a file is missing. */
export const VOICE_RECORDING_GLOW_SOURCES = {
  light: [
    VOICE_RECORDING_GLOW_IMAGES.light,
    VOICE_RECORDING_GLOW_IMAGES.fallback,
    VOICE_RECORDING_GLOW_IMAGES.dark,
  ],
  dark: [
    VOICE_RECORDING_GLOW_IMAGES.dark,
    VOICE_RECORDING_GLOW_IMAGES.fallback,
    VOICE_RECORDING_GLOW_IMAGES.light,
  ],
} as const;
