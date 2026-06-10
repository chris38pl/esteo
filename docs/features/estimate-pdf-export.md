# Estimate PDF export and preview

> **Status:** Phase 1 implemented (export, preview, Dokumenty tab).

## Goal

Generate a branded, client-ready PDF from a specific **estimate version** after the user finishes editing. Preview reuses the same pipeline without opening a new browser tab.

## Architecture

```txt
Header (Preview / More → Save as PDF)
  → exportEstimatePdfAction (server)
  → freshness check (status READY, generatedLocale, generatedAt vs version.updatedAt)
  → upsert EstimatePdf (PENDING) → Trigger.dev: generate-estimate-pdf
  → HTML template (src/pdf/) → Puppeteer → UploadThing
  → EstimatePdf (READY, fileKey + storageCustomId)
  → signed URL → export: new tab | preview: blob URL in modal
```

Send to client (Phase 2) will reuse the same `EstimatePdf` pipeline and DB lifecycle status.

## Key files

| Area | Path |
| --- | --- |
| Trigger task | `src/trigger/generate-estimate-pdf.ts` |
| Generation | `src/features/estimates/server/generate-and-store-estimate-pdf.ts` |
| Server actions | `src/features/estimates/server/pdf-export-actions.ts` |
| Storage | `src/features/estimates/server/pdf-storage-service.ts` |
| HTML/PDF render | `src/pdf/server/render-estimate-pdf.ts`, `src/pdf/templates/` |
| Export hook | `src/features/estimates/hooks/use-estimate-pdf-export.ts` |
| Shared output | `src/features/estimates/hooks/use-estimate-pdf-output.ts` |
| Preview hook + dialog | `use-estimate-pdf-preview.ts`, `estimate-pdf-preview-dialog.tsx` |
| UI | `estimate-header-pdf-export-menu-item.tsx`, `estimate-pdf-documents-section.tsx` |

## Data model

Generated PDFs use **`EstimatePdf`** — separate from user **`EstimateAttachment`** uploads.

```prisma
enum EstimatePdfStatus {
  PENDING
  GENERATING
  READY
  FAILED
}

model EstimatePdf {
  id              String            @id @default(cuid())
  estimateId      String
  versionId       String            @unique
  fileKey         String?           // UploadThing file key — null until READY
  storageCustomId String?           // UploadThing customId from upload — null until READY
  status          EstimatePdfStatus @default(PENDING)
  errorMessage    String?
  generatedAt     DateTime          @default(now())
  generatedLocale String?
  createdById     String?
}
```

Migrations: `20260610140000_estimate_pdf`, `20260610180000_estimate_pdf_lifecycle`, `20260610200000_estimate_pdf_generated_locale`.

### Storage identifiers

- **`fileKey`** — real UploadThing file key returned by `storage.upload()`. Used for signed download URLs and `deleteFiles({ keyType: "fileKey" })`.
- **`storageCustomId`** — UploadThing `customId` sent with the upload. Used for cleanup on overwrite via `deleteFiles({ keyType: "customId" })`.
- **`EstimatePdf.id`** — database record ID; **not** reused as UploadThing `customId` (each upload gets a fresh `createId()`).
- **Logical path** `{workspaceId}/pdfs/{estimatePdfId}/original.pdf` — diagnostic/logging only. Never stored as `fileKey`, never passed to `deleteFiles()`.

Legacy pre-fix records (logical `fileKey` stored, or missing `storageCustomId`) are auto-healed on next export.

### Lifecycle

```txt
Export requested → PENDING
Task starts      → GENERATING
Upload success   → READY (fileKey + storageCustomId + generatedAt + generatedLocale)
Any failure      → FAILED (errorMessage)
```

DB status is the source of truth. Trigger.dev `runs.retrieve(runId)` is used for fast-fail polling during export/preview (max 60s).

### Freshness and overwrite

- **One PDF per version** — re-export of the same version overwrites the previous file and metadata.
- **Freshness:** PDF is reused without regenerating when all of the following hold:
  - `status === READY`
  - `generatedLocale === request locale` (UI locale at export time — switching PL/EN triggers regen even if the estimate was not edited)
  - `generatedAt >= version.updatedAt`
- Legacy records with `generatedLocale = null` are regenerated on next export.
- **Overwrite cleanup** (before upload): delete by stored `fileKey`, then `storageCustomId`, then legacy fallback `customId = EstimatePdf.id`.

## Client UX

### Export (More → Zapisz jako PDF / Save as PDF)

- **Autosave gate:** unsaved edits are flushed before export; user sees error if save cannot complete.
- **Popup-safe open:** blank tab opened synchronously on click, then navigated to signed PDF URL when ready.
- **Progress:** bottom Sonner toast during generation (`src/components/ui/sonner.tsx`).
- **Polling:** ~2s interval, max **60 seconds**; on timeout or failure → error toast.
- **Refresh:** `router.refresh()` after open (Dokumenty tab, `generatedAt`).

### Preview (Podgląd / Preview)

- Inline header button + More menu item.
- Opens `EstimatePdfPreviewDialog` with loading spinner.
- Same server pipeline as export (`useEstimatePdfOutput`, `mode: "preview"`).
- Fetches signed URL into a **blob URL** for iframe display (UploadThing blocks X-Frame-Options).
- Dialog footer: Close (revokes blob URL) and Download PDF.
- Errors shown in the dialog (no export toast).

### Dokumenty tab

- Lists **READY** PDFs for the estimate (version, date, download).
- Powered by `EstimatePdf`, not `EstimateAttachment`.

### Summary tab

- Recommendation **generate_pdf** triggers the same export flow.

## PDF content

- Layout matches product mockup (hero image, summary cards, grouped sections, footer).
- Provider data from `WorkspaceSettings` company fields + branding logo/colors.
- Client/investment from linked `EstimateRequest` + industry fields.
- Line items from **version snapshot only** (`getVersionWithTree`).
- **FREE plan:** watermark on PDF.
- Filename prefix: `wycena-` (PL) / `estimate-` (EN).

## Activity log

Successful generation logs `estimate_exported` (`SHARING`) with `metadata.format: "pdf"`, `versionId`, `estimatePdfId`, `cached`.

Preview is not logged in v1.

## Trigger.dev

- PDF generation runs on Trigger.dev workers (not on Vercel serverless).
- Task id: `generate-estimate-pdf` (`trigger.config.ts` — build extension: `puppeteer()`; external: `uploadthing`, `puppeteer-core`, `sharp`).
- The Trigger.dev Puppeteer extension installs Chrome in the worker image during deploy.
- `PUPPETEER_EXECUTABLE_PATH` is injected automatically during deploy — do not set it manually in the Trigger dashboard unless the extension env is missing after redeploy.
- For local `trigger:dev`, define `PUPPETEER_EXECUTABLE_PATH` in `.env.local` (path to your local Chrome; the extension does not install Chrome in dev mode).
- Worker env must include `UPLOADTHING_TOKEN`, `DATABASE_URL` (see [`deployment.md`](../architecture/deployment.md)).
- Diagnostic log `Launching PDF browser` (with `executablePath`) is emitted in `generate-estimate-pdf` before rendering.
- If `PUPPETEER_EXECUTABLE_PATH` is unset, rendering fails with a clear error before Puppeteer launch.

## Dev diagnostics and logging

### UploadThing upload debug

Optional dev-only diagnostics in `src/features/attachments/server/storage/uploadthing-diagnostic.ts`:

- Auto-on in local `NODE_ENV=development` unless `UPLOADTHING_UPLOAD_DEBUG=0`.
- Writes HTTP traces to `logs/ut-upload-debug.jsonl`.
- When enabled, `UTApi` uses `logLevel: "Debug"` — very verbose in Trigger.dev terminal.

**Quiet local dev:** set `UPLOADTHING_UPLOAD_DEBUG=0` in `.env.local` and restart `trigger:dev`.

### Effect version dedupe

UploadThing uses the Effect-TS library. Duplicate `effect` versions (e.g. Prisma config vs UploadThing) caused repeated WARN logs in Trigger.dev. Root `package.json` pins a single version:

```json
"overrides": {
  "effect": "3.17.7"
}
```

## Out of scope (Phase 1)

- Send to client / email (Phase 2)
- Multiple templates / custom hero images
- PDF exports in attachment quota
- XLSX export

## Related

- [`estimates.md`](estimates.md)
- [`estimate-attachments.md`](estimate-attachments.md) — user uploads only (separate domain)
- [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md)
- [`workspace-branding-and-company-profile.md`](workspace-branding-and-company-profile.md)
- [Incident: PDF Chromium on Trigger worker](../incidents/2026-06-10-estimate-pdf-chromium-trigger-worker.md)
