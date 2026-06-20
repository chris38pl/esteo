# Form reset after attachment upload (dev only)

**Date:** 2026-06-20  
**Status:** Resolved  
**Affected:** Public `/wycena/...` and internal “Nowa wycena” modal during local development after Etap 2 pre-upload

## Symptom

After adding an attachment (pre-upload flow):

- Page shows **“Compiling/Rendering…”** at the bottom
- Form fields and attachments are cleared
- Upload API returns **200 OK** — upload itself succeeds
- Happens on almost every file add in `npm run dev`

## What was NOT the root cause

- Upload API failure or staging attachment logic
- Client abort / delete during upload
- Submit or validation errors

## Root cause (primary)

Dev-only UploadThing diagnostics wrote **`logs/ut-upload-debug.jsonl`** inside the project on every upload event (multiple `writeFile` calls per file). Next.js dev file watcher treated this as a source change → recompile → RSC refresh → React remount → lost form state.

Pre-upload (Etap 2) amplified this: one file per request instead of one batch log per multipart submit.

**Staging/production:** diagnostics disabled (`NODE_ENV !== "development"`) — bug did not occur there.

## Root cause (secondary)

`CreateEstimateModal` reset form in `useEffect([open, formData.fields])`. After RSC refresh, parent could pass a new `formData.fields` reference while modal stayed open → effect re-ran and cleared the form again.

## Fix

1. Move diagnostic log to OS temp dir: `{tmpdir}/esteo-ut-upload-debug.jsonl` ([`uploadthing-diagnostic.ts`](../../src/features/attachments/server/storage/uploadthing-diagnostic.ts))
2. Webpack dev `watchOptions.ignored` for `**/logs/**` ([`next.config.ts`](../../next.config.ts))
3. Modal reset only on `open: false → true` ([`create-estimate-modal.tsx`](../../src/features/estimates/components/create-estimate-modal.tsx))

## Patterns to reuse

- **Never write runtime logs under project `src/` or repo root during request handling in dev** — use temp dir or `.next/cache`
- Disable locally: `UPLOADTHING_UPLOAD_DEBUG=0` in `.env.local`

## Related

- [2026-06-07 UploadThing customId batch upload](./2026-06-07-uploadthing-customid-batch-upload-partial-failure.md)
- [Upload diagnostic module](../../src/features/attachments/server/storage/uploadthing-diagnostic.ts)
