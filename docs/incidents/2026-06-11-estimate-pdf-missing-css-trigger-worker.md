# Estimate PDF — missing CSS on Trigger.dev worker

**Date:** 2026-06-11  
**Status:** Resolved  
**Affected:** `generate-estimate-pdf` on Vercel Preview / Trigger Production — PDF generated but layout unstyled  
**Related:** [Estimate PDF export](../features/estimate-pdf-export.md), [PDF Chromium incident](./2026-06-10-estimate-pdf-chromium-trigger-worker.md)

---

## Symptom

- **Localhost:** PDF preview/export shows full branded layout (grid, cards, table styles).
- **Vercel Preview (staging):** PDF generates successfully but looks like raw HTML — stacked blocks, default serif font, only hero gradient visible (SVG fallback).

---

## Root cause

[`estimate-pdf-template.ts`](../../src/pdf/templates/estimate-pdf-template.ts) loaded styles via:

```typescript
readFileSync(join(process.cwd(), "src", "pdf", "templates", "estimate-pdf.css"), "utf8");
```

with a **silent `catch` returning `""`**.

On Trigger.dev workers the bundled task has **no `src/` directory** at runtime — only compiled JS. The read failed, Puppeteer rendered HTML without `<style>` content.

Hero image used the same `process.cwd()` pattern; missing file fell back to gradient SVG (expected when `hero-house.jpg` is not committed).

---

## Fix

1. **Inline CSS** in [`estimate-pdf-styles.ts`](../../src/pdf/templates/estimate-pdf-styles.ts) and import in the template (bundled with the task).
2. Keep [`estimate-pdf.css`](../../src/pdf/templates/estimate-pdf.css) as the human-editable source; sync into `estimate-pdf-styles.ts` when changing layout.
3. **`additionalFiles`** in [`trigger.config.ts`](../../trigger.config.ts) for `public/images/pdf/**` so optional hero JPEG is available on workers.
4. **Mobile preview:** document that iframe blob PDF preview is not reliable on mobile; show explicit Open PDF CTA in [`estimate-pdf-preview-dialog.tsx`](../../src/features/estimates/components/estimate-pdf-preview-dialog.tsx).

---

## Verification

1. Redeploy Trigger worker (`npm run trigger:deploy` to staging project).
2. Export/preview PDF on Vercel Preview — layout matches localhost.
3. Mobile preview shows Open PDF instead of broken iframe.

---

## Pattern

Do not read project-relative assets from `process.cwd()/src/...` in Trigger tasks unless those paths are guaranteed via `additionalFiles` **and** cwd is verified. Prefer **inlining** small static assets (CSS) into the JS bundle.
