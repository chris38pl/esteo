Assets for the estimate PDF template. Copied to Trigger.dev workers via `additionalFiles` in `trigger.config.ts`.

Runtime loaders also resize these via `optimizePdfImage` before inlining - keep source files close to display size to reduce worker memory.

| File | Purpose | Target size |
|------|---------|-------------|
| `hero-house.webp` | Hero image (top right of page 1). Gradient fallback if missing. | ~480×256 |
| `esteo-logo.png` | Owl logo in the Esteo promo banner (copy from `public/logo.png`). | ~80×80 |
| `esteo-promo.webp` | Center illustration in the Esteo promo banner at the bottom. | ~220×140 |

Fonts for PDF rendering live in [`public/fonts/pdf/`](../fonts/pdf/README.md).
