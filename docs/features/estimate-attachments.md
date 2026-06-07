# Estimate Attachments

Workspace-scoped file storage for estimate attachments. Phase 1 covered **editor uploads** only. Phase 2 adds **request form uploads** (public + internal) with promotion to `EstimateAttachment` after Trigger.dev.

## Storage model

Storage belongs to the **workspace**, not the user or subscription plan.

| Field | Location | Purpose |
| --- | --- | --- |
| `attachmentStorageUsedBytes` | `Workspace` | Aggregated stored bytes (processed files) |
| `attachmentStorageLimitBytes` | `Workspace` | Quota cap (default **250 MB** = `262144000`) |
| `attachmentCount` | `Estimate` | Derived cache of `EstimateAttachment` rows — **SET only**, never `+=`/`-=` |

Future add-ons increase `attachmentStorageLimitBytes` per workspace — no schema change required.

All file sources (editor, public requests, internal requests) share this single counter via `usage-service.ts`.

### `attachmentCount` cache rule

List and dashboard reads use **`Estimate.attachmentCount` only**. Do not run `COUNT()` or `_count` joins on `EstimateAttachment` in list pages, dashboard widgets, or batch list queries.

Writes always go through `syncEstimateAttachmentCount(estimateId)` after:

- Request attachment promotion (Trigger.dev)
- Editor upload
- Attachment delete

## `fileSizeBytes` semantics

On `EstimateAttachment`:

```txt
At ingest: processed original bytes only
After async thumbnail job (IMAGE): increment by thumbnail bytes
```

- Does **not** reflect raw client upload size
- Used for quota increment/decrement
- Shown in the estimate attachments UI (may show original-only size while `thumbnailStatus` is `PENDING` or `PROCESSING`)

## Supported types

**Images:** JPG/JPEG, PNG, WEBP — resized (max width 2000px), compressed; **300px thumbnail generated asynchronously**  
**Documents:** PDF — stored as-is, no thumbnail (icon in UI)  
**Documents:** DOCX — stored as-is, no thumbnail (icon in UI)

MIME allowlists: `ALLOWED_IMAGE_MIME_TYPES`, `ALLOWED_DOCUMENT_MIME_TYPES` in `src/features/attachments/lib/allowed-mime-types.ts`.

## Upload limits

| Limit | Value | Scope |
| --- | --- | --- |
| Per file (editor) | 20 MB (raw upload) | Safety |
| Per batch (editor) | 20 files | Abuse protection |
| Per request submit | 10 files, 10 MB total | Public + internal forms |
| Workspace quota | `attachmentStorageLimitBytes` | Stored bytes only |

Request limits: `src/features/attachments/lib/request-limits.ts`.

## Storage key layout

Two namespaces in UploadThing:

| Source | Key pattern | When |
| --- | --- | --- |
| Estimate request submit | `{workspaceId}/requests/{requestId}/{fileId}/original-{name}` (+ optional `thumb-`) | Upload before DB create |
| Estimate editor | `{workspaceId}/{estimateId}/{attachmentId}/original-{name}` | Direct upload to estimate |

Helper: `buildRequestStorageKey()` in `upload-service.ts`.

Request-scoped keys belong to the request lifecycle until promotion copies metadata into `EstimateAttachment` (same `storageKey`, no blob copy in Phase 2).

### UploadThing `customId` (important)

Do **not** send the full logical storage path as UploadThing `customId`. UT stores it as `external_id`; long paths (~120+ chars with long filenames) cause ingest HTTP 500.

| Field | Value sent to UT | Stored in DB after upload |
| --- | --- | --- |
| `customId` | `fileId` / attachment UUID (36 chars) | — |
| Thumbnail `customId` | `{attachmentId}-thumb` | — |
| `storageKey` | — | UT file key (`YO4vGzP4JADj...`) for delete/download |

Logical path (`buildRequestStorageKey`) is kept for logging only. See [incident note](../incidents/2026-06-07-uploadthing-customid-batch-upload-partial-failure.md).

## Editor upload pipeline

```txt
validate → process original only → quota check (original bytes) → UploadThing upload (1× per file)
→ DB save (thumbnailStatus=PENDING for IMAGE) → syncEstimateAttachmentCount
→ enqueue batched generate-attachment-thumbnails job
```

Quota is checked **before** any UploadThing upload (original bytes only). Thumbnail bytes are checked again inside the async job using actual generated size.

Implementation: `POST /api/attachments/upload`, `src/features/attachments/server/upload-service.ts`.

## Async image thumbnails

Thumbnails are **not** generated during submit or editor upload. A Trigger.dev job (`generate-attachment-thumbnails`) downloads the stored original, generates a 300px thumbnail, quota-checks the actual thumb size, uploads to UploadThing, and updates the row.

### Submit-time UploadThing upload count (verification metric)

| Scenario | Before | After |
| --- | --- | --- |
| 8 images on request submit | 16 UT uploads (8 originals + 8 thumbs) | **8** UT uploads (originals only) |
| Thumbnails for those 8 images | Synchronous during submit | Async via `generate-attachment-thumbnails` |

**How to verify:** submit 8 images; during submit only, count `original-` uploads — expect **8**, zero `/thumb-` uploads until the Trigger job runs.

### `AttachmentThumbnailStatus` lifecycle

| Status | Meaning |
| --- | --- |
| `NOT_APPLICABLE` | PDF/DOCX |
| `PENDING` | Original stored; thumb job queued or not started |
| `PROCESSING` | Trigger job actively working on this attachment |
| `GENERATED` | Thumbnail uploaded; `hasThumbnail` true in UI |
| `FAILED` | Non-blocking failure; original still usable; `thumbnailGenerationError` (max 1000 chars) |

Transitions: `PENDING → PROCESSING → GENERATED` on success; `PROCESSING → FAILED` on error; retries re-enter from `FAILED` to `PROCESSING`.

### Batching rule

One user action → **one** Trigger run with all IMAGE attachment ids from that batch:

- Editor: after `uploadPreparedAttachments`
- Request: after `promoteRequestAttachmentsToEstimate` (not gated on AI success)

Never trigger one job per attachment.

### Trigger.dev log events

| Event | Level | When |
| --- | --- | --- |
| `Thumbnail generation batch started` | info | Task run start |
| `Thumbnail generation started` | info | After setting `PROCESSING` |
| `Thumbnail generation completed` | info | After `GENERATED` |
| `Thumbnail generation failed` | error | Catch / non-retryable quota failure |
| `Thumbnail generation skipped — already generated` | info | Idempotent skip |
| `Thumbnail generation skipped — attachment not found` | info | Row deleted |

All per-attachment events include `attachmentId`, `estimateId`, `thumbnailStatus`, and Trigger `attempt`.

### UI behavior

- `IMAGE` + `PENDING` / `PROCESSING` / `FAILED` → file icon placeholder (no error toast)
- `IMAGE` + `GENERATED` → signed thumbnail URL for card preview
- Poll every 4s via `listEstimateAttachmentsAction` while any attachment needs refresh; stop after **8 attempts** or **30s**

### Backfill

After migration, run:

```bash
npm run prisma:backfill-attachment-thumbnails
```

Enqueues batched jobs for existing IMAGE rows in `PENDING` or `FAILED`.

## Request form upload pipeline (Phase 2)

Single service for public and internal forms: `submitEstimateRequestWithAttachments`.

```txt
validate payload + file limits
→ quota pre-check (original processed bytes only)
→ pre-generate estimateId, versionId, requestId
→ per-file UploadThing upload to requests/{requestId}/ (1× per file; partial success)
→ if all uploads failed when files provided: cleanup UT keys, abort (no DB create)
→ DB transaction: Estimate + EstimateRequest + version; attachments JSON; promotionStatus PENDING
→ trigger generate-estimate-draft
→ return requestNumber + optional attachmentWarnings
```

API routes:

- `POST /api/public/estimate-requests` — multipart, honeypot, rate limit, Turnstile
- `POST /api/estimate-requests/internal` — auth MEMBER, same service

If DB create fails after successful uploads, request-scoped UploadThing keys are deleted (compensation).

## Request attachment metadata (pre-promotion)

Stored on `EstimateRequest.attachments` JSON until promotion. Types in `request-attachment-metadata.ts`:

- `status: "stored" | "failed"` per file
- `promotedAt` set after successful promotion
- `storageKey` is request-scoped

## Attachment promotion (Trigger.dev)

Module: `promote-request-attachments.ts`, invoked early in `generate-estimate-draft.ts`.

**Promotion is independent of AI quality** — runs when `Estimate` + `EstimateVersion` exist, regardless of draft completeness or AI errors. After promotion, a batched `generate-attachment-thumbnails` job is enqueued for promoted IMAGE ids.

Promotion status on `EstimateRequest.aiMetadata`:

| Value | Meaning |
| --- | --- |
| `PENDING` | Request created with ≥1 stored attachment |
| `COMPLETED` | Rows created in `EstimateAttachment`, count synced |
| `FAILED` | Promotion threw; `attachmentsPromotionError` set |

`EstimateAttachment` has **only** `estimateId` FK — no `estimateRequestId`. Anonymous public uploads use nullable `uploadedById`; `uploadSource` is `EDITOR`, `PUBLIC_REQUEST`, or `INTERNAL_REQUEST`.

## Public estimate request forms

When workspace storage is exhausted, submit is rejected if the user attached files (`attachmentAvailability` pre-check). Requests without attachments may still be submitted.

Partial success: some files may fail upload while others succeed; entities are created unless **all** uploads fail.

## Future derived assets

Phase 1–2 store `original` + async `thumbnail` (images). Future phases may add OCR results, AI previews, or additional variants.

## Future maintenance (not implemented)

### `cleanup-orphan-request-attachments`

Scheduled job (e.g. daily Trigger.dev cron) to remove UploadThing blobs without valid lifecycle:

- Abandoned uploads (upload succeeded, DB create never ran)
- Stale request-scoped blobs under `requests/{requestId}/` where request no longer exists
- Retention policy for promoted/failed request attachments (e.g. 30+ days)

Phase 2 mitigates orphans via submit compensation; long-term cleanup remains a planned maintenance task.

## Feature module

```txt
src/features/attachments/
  components/estimate-attachments-panel.tsx
  lib/
    build-thumbnail-storage-key.ts
    request-attachment-metadata.ts
    request-limits.ts
    thumbnail-status.ts
    truncate-thumbnail-error.ts
  server/
    upload-service.ts
    promote-request-attachments.ts
    thumbnail-generation-service.ts
    enqueue-attachment-thumbnails.ts
    sync-attachment-count.ts
    assert-workspace-storage.ts
    usage-service.ts
    storage/
    cleanup-service.ts
src/trigger/
  generate-attachment-thumbnails.ts
```
