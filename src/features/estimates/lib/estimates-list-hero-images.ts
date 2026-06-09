/**
 * Background artwork for estimates list hero cards.
 *
 * Place files in `public/images/estimates-list/`:
 * - hero-create-light.webp — left card, light mode
 * - hero-create-dark.webp  — left card, dark mode
 * - hero-form-light.webp   — right card, light mode
 * - hero-form-dark.webp    — right card, dark mode
 */
export const ESTIMATES_LIST_HERO_IMAGES = {
  create: {
    light: "/images/estimates-list/hero-create-light.webp",
    dark: "/images/estimates-list/hero-create-dark.webp",
  },
  form: {
    light: "/images/estimates-list/hero-form-light.webp",
    dark: "/images/estimates-list/hero-form-dark.webp",
  },
} as const;

/** Card fills — must match artwork edge colors for a seamless blend. */
export const ESTIMATES_LIST_HERO_BACKGROUNDS = {
  create: {
    light: "#eff6fe",
    dark: "#0b152d",
  },
  form: {
    light: "#ecfdf5",
    dark: "#02131b",
  },
} as const;
