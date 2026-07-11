# Billing plan hero banners

Place **6** WebP files here (one artwork per plan × theme):

| File | Plan | Theme |
|------|------|-------|
| `hero-free-light.webp` | FREE | light |
| `hero-free-dark.webp` | FREE | dark |
| `hero-pro-light.webp` | PRO | light |
| `hero-pro-dark.webp` | PRO | dark |
| `hero-business-light.webp` | BUSINESS | light |
| `hero-business-dark.webp` | BUSINESS | dark |

## Artwork guidelines

- Same convention as `public/images/estimates-list/`: **tall strip** with the owl/mascot on the **right edge**, not a full-width composed banner.
- Left side of the file should be mostly empty / background color so the UI can mirror the artwork into the gap on the left.
- Export height ~512–640px; intrinsic width only as wide as the character + glow (typically &lt; 50% of the card).
- **Light** files: edge color should match `BILLING_PLAN_HERO_BACKGROUNDS` in `src/features/billing/lib/billing-plan-hero-images.ts`.
- **Dark** files: same - update background hex in that file if you change the card fill.

If the source WebP spans the entire card width, the mirror logic has no gap to fill and the left reflection will not appear.
