# Public form: 1 of 7 attachments saved (UploadThing customId too long)

**Date:** 2026-06-07  
**Status:** Resolved  
**Affected:** Public (and internal) estimate request forms with multiple attachments, especially files with long names

## Symptom

User submitted **7 PNG attachments** via the public estimate request form. Only **1** was stored; **6** failed with `[UPLOAD_FAILED] Failed to upload file`. The API still returned success (partial success by design).

Reference batch (before fix): request `htaaolihfnzwbca21pxuzpe7` — `storedCount: 1`, `failedCount: 6`.

## What was NOT the root cause

- **Prisma / Neon** — error text `insert into file` comes from UploadThing's internal DB, not our schema
- **Duplicate customId** within the batch — each file had a unique UUID in the path
- **Rate limiting** — `ratelimit-remaining: 19` on every failure (limit 20)
- **Parallel uploads** — uploads are sequential (`for` + `await`)
- **Synchronous thumbnails at submit** — already moved to async Trigger.dev job before diagnosis completed

## Root cause

We sent the **full logical storage path** as UploadThing `customId`:

```txt
{workspaceId}/requests/{requestId}/{fileId}/original-{sanitizedFileName}
```

UploadThing stores this as `external_id`. Ingest returned **HTTP 500** when the path exceeded an effective length limit (~120+ chars depending on filename). File #1 (`plan taras.png`) had the shortest path and succeeded; files #2–#7 with long `ChatGPT Image...` names failed deterministically.

## Fix

**UUID-only `customId`** — send `item.id` (36 chars) to UploadThing; keep the logical path only for logging.

| Layer | Change |
| --- | --- |
| `storage/types.ts` | `upload({ key, customId, ... })` |
| `uploadthing-provider.ts` | `UTFile` uses `params.customId`, not `params.key` |
| `upload-service.ts` | `customId: item.id` for originals |
| `thumbnail-generation-service.ts` | `customId: \`${attachment.id}-thumb\`` |

`storageKey` in DB remains the **UploadThing file key** returned after upload (for delete/download/signed URLs).

### Verification

Re-test with the same 7 files: request `xz46wa7vd3u9g4ajmjw97thm` — **`storedCount: 7`, `failedCount: 0`**. All ingest PUTs used short UUID in `x-ut-custom-id`.

## Dev diagnostics (kept intentionally)

Module: `src/features/attachments/server/storage/uploadthing-diagnostic.ts`

- **Enabled:** local `npm run dev` only (`NODE_ENV=development`)
- **Disabled:** Vercel staging and production
- **Output:** `{OS temp dir}/esteo-ut-upload-debug.jsonl` (overwritten each batch; path from `getUploadDiagnosticLogPath()`)
- **Disable locally:** `UPLOADTHING_UPLOAD_DEBUG=0` in `.env.local`

Full investigation write-up: [../diagnostics/2026-06-07-uploadthing-customid-batch-upload.md](../diagnostics/2026-06-07-uploadthing-customid-batch-upload.md)

## Patterns to reuse

- Do **not** use long storage paths as UploadThing `customId` — use a short stable ID (attachment/file UUID)
- If you see `Failed query: insert into file` during upload, inspect **UploadThing ingest HTTP response**, not Prisma
- When debugging multi-file uploads locally, use `{tmpdir}/esteo-ut-upload-debug.jsonl` and compare `customIdLength` vs outcome

## Related

- Feature docs: [../features/estimate-attachments.md](../features/estimate-attachments.md)
- Upload provider: [`uploadthing-provider.ts`](../../src/features/attachments/server/storage/uploadthing-provider.ts)
