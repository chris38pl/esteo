# Public estimate-request hero backgrounds

Industry-specific full-page backgrounds for `/{locale}/estimate-request/{workspaceSlug}`.

Configured in `src/features/estimate-requests/config/estimate-request-hero-images.ts`.

## Folder structure

Each industry has its own subfolder with **two** WebP files:

```
public/images/estimate-request/
  construction/
    hero-light.webp
    hero-dark.webp
  carpentry/          ← custom furniture / fit-outs (CARPENTRY)
    hero-light.webp
    hero-dark.webp
  electrical/         ← electrical (ELECTRICAL)
    hero-light.webp
    hero-dark.webp
  services/           ← generic services (workspace industry OTHER)
    hero-light.webp
    hero-dark.webp
  plumbing/           ← optional; code falls back to construction until assets exist
    hero-light.webp
    hero-dark.webp
```

## Workspace industry mapping

| `WorkspaceIndustry` | Folder |
|---------------------|--------|
| `CONSTRUCTION` | `construction` |
| `CARPENTRY` | `carpentry` |
| `ELECTRICAL` | `electrical` |
| `OTHER` | `services` |
| `PLUMBING` | `construction` (fallback in code until `plumbing/` assets exist) |

## Asset guidelines

- Format: **WebP** (preferred), ~1920×1080 or wider
- Composition: subject/visual weight on the **right**; left side calmer for hero copy
- Rendered at **full container height**, left-aligned; top and bottom edges always visible. On wide viewports the same image is **mirrored horizontally** (`-scale-x-100`) to the right of the main artwork (same pattern as estimates list hero cards). Gradients overlay on top.
- Replace placeholder copies in `carpentry/`, `electrical/`, and `services/` with final brand artwork

## Adding a new industry

1. Add folder under `public/images/estimate-request/{slug}/` with `hero-light.webp` and `hero-dark.webp`
2. Extend `INDUSTRY_SLUG` in `estimate-request-hero-images.ts`
3. Verify on a workspace with that industry in light and dark mode
