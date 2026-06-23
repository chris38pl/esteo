# Internal Issue Tracker (v1)

Staging-only tool for **quick bug capture** during manual testing on Vercel Preview (or localhost). Issues are stored in the Neon **staging** database and can be analyzed in Cursor either via **Copy Cursor Prompt** in the admin panel or via the local **`sync:issues`** script.

This is **not** a full ticket system — no assignees, SLA, or AI triage in v1.

Related: [`scripts.md`](../../scripts.md#issue-tracker--sync-do-cursor), [`deployment.md`](../architecture/deployment.md), [`database-migrations.md`](../dev/database-migrations.md).

---

## Goals (v1)

| Goal | How |
| --- | --- |
| Fast reporting while testing Preview | Sidebar **“Zgłoś błąd”** → quick capture dialog |
| Rich context for debugging | Auto metadata (URL, device, viewport, workspace), optional screenshots, optional voice-to-text |
| Cursor analysis without building a ticket UI | Admin **Copy Cursor Prompt** or local `docs/issues/` sync |
| Safe on Production | Hard-disabled when `VERCEL_ENV=production`; env flag required elsewhere |

---

## Access control

| Action | Who |
| --- | --- |
| Report issue (sidebar dialog) | Any **authenticated** user when tracker is enabled |
| Upload screenshots to own issue | Reporter only (`reportedById === user.id`) |
| View issue list / detail | **Platform admin** or **QA tester** (`User.platformRole = QA_TESTER`) |
| Add comments / replies | Platform admin or QA tester |
| Edit own comments | Platform admin or QA tester |
| Edit issue title / description | Platform admin or QA tester |
| Change status OPEN ↔ RESOLVED | Platform admin or QA tester; `RESOLVED` requires an implementation comment |
| Copy Cursor Prompt / Copy Issue URL | Platform admin or QA tester |
| `sync:issues` / `issue:comment` CLI | Developer machine (reads DB + UploadThing for sync) |

Guards: `src/lib/issue-tracker/guard.ts`

```txt
Enabled when:
  VERCEL_ENV !== "production"
  AND ENABLE_ISSUE_TRACKER === "true"

UI flag (sidebar button):
  issueTrackerEnabled = isIssueTrackerEnabled()   // any logged-in user

Admin routes additionally:
  assertIssueViewerAccess()   // PLATFORM_ADMIN or QA_TESTER

QA tester UI:
  Sidebar section "QA Testing" → /dashboard/qa/issues
  Role assigned by platform admin in Admin → Users
```

**Never** set `ENABLE_ISSUE_TRACKER=true` on Vercel **Production**.

---

## Environments

| Where | `IssueEnvironment` | DB branch | Tracker enabled |
| --- | --- | --- | --- |
| `localhost:3000` | `LOCALHOST` | Neon `development` | `ENABLE_ISSUE_TRACKER=true` in `.env.local` |
| Vercel Preview (`staging` git branch) | `PREVIEW` | Neon `staging` | `ENABLE_ISSUE_TRACKER=true` in Vercel **Preview** env |
| Vercel Production | — | Neon `production` | **Always off** (guard) |

Resolver: `src/lib/app-environment.ts` → `resolveIssueEnvironment()`.

### Deploying to Preview

1. Commit + push to git branch **`staging`** → Vercel Preview build (migrations run automatically via `build:vercel`).
2. Set **`ENABLE_ISSUE_TRACKER=true`** in Vercel → Settings → Environment Variables → **Preview** only.
3. Redeploy Preview if the env var was added after the last build.

Manual migration (optional, idempotent): `npm run prisma:migrate:staging`.

---

## User flows

### Report issue (any user)

```txt
Sidebar footer → "Zgłoś błąd"
  → ReportIssueDialog
    → createIssueAction()        // server action
    → POST /api/attachments/upload (issueId + files[])   // if screenshots
  → toast: "Issue #N saved"
```

**Required fields:** Type, Title, Description.

**Collapsed “Więcej szczegółów”:** Priority (default `MEDIUM`), reproduction steps, expected/actual behavior.

**Auto-collected metadata** (`collectIssueMetadata`):

- `pageUrl` — current pathname + search
- `context` — `{ workspaceSlug }` when active workspace known
- `locale`, `userAgent`, `deviceType`, `viewportWidth`, `viewportHeight`
- `environment` — resolved server-side

**Voice input:** browser `SpeechRecognition` appends to description (client-only, no backend storage). Hook: `use-speech-recognition.ts`.

### Admin triage (platform admin)

| Route | Purpose |
| --- | --- |
| `/dashboard/admin/issues` | Table: #, title, type, priority, status, created |
| `/dashboard/admin/issues/[number]` | Detail, screenshots (signed URLs), comments, status toggle |

**Status in UI v1:** `OPEN`, `ON_HOLD`, `RESOLVED`. Moving to `RESOLVED` requires a comment describing what was implemented.

**Status outside UI (DB / future admin):** `IN_PROGRESS`, `ARCHIVED`.

**Copy Cursor Prompt** — clipboard markdown for Cursor chat (`build-cursor-prompt.ts`).

**Copy Issue URL** — deep link to admin detail on current origin (`build-issue-admin-url.ts`).

**Implementation comments** — after a fix, add a durable comment per issue. CLI shortcut:

```bash
npm run issue:comment -- --issue=123 --resolve --message="Zaimplementowano: ... Testy: ..."
```

Without `--author-email` / `ISSUE_COMMENT_AUTHOR_EMAIL`, the CLI writes the comment and activity history as **Cursor AI**.

**History** — issue detail has a `Pokaż: Komentarze / Historia` switch. History logs title changes, description changes, status changes, and comment add/edit/delete events with actor and timestamp.

Nav: Admin sidebar → **Issue tracker** (hidden when tracker disabled).

---

## Data model

Migration: `prisma/migrations/20260614222421_issue_tracker/`

### Numbering

`Issue.number` is **not** `@default(autoincrement())`. A singleton counter allocates numbers in a transaction:

```txt
IssueNumberCounter { id: "default", value: Int }
  → upsert + increment in allocateIssueNumber()
```

First issue on a fresh DB gets `#1` (counter created on first allocation).

### `folderSlug` — immutable

Set **once** in `createIssueAction` via `slugifyIssueTitle(title)`.

**Never updated** on title edit, re-sync, or admin update. Sync folder name:

```txt
docs/issues/{number}-{folderSlug}/
```

Changing slug after create would duplicate folders and break local workflows.

### `context` — JSON

Extensible metadata without schema migrations:

```typescript
type IssueContext = {
  workspaceSlug?: string;
  estimateId?: string;
  estimateVersionId?: string;
  requestId?: string;
};
```

v1 writes `{ workspaceSlug }` when reporting from a workspace route. Zod: `issue-context.ts`.

### `fixedIn` — optional (v1 DB only)

String like `"preview-127"` or `"v0.8.4"`. Not in UI v1; set via SQL or future admin. Lives in DB after RESOLVED (sync deletes local folder).

### Enums

| Enum | Values |
| --- | --- |
| `IssueType` | `BUG`, `UX`, `FEATURE`, `AI_EXTRACTION`, `PERFORMANCE` |
| `IssuePriority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `IssueStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `ARCHIVED` |
| `IssueEnvironment` | `LOCALHOST`, `PREVIEW`, `PRODUCTION` |
| `IssueDeviceType` | `MOBILE`, `TABLET`, `DESKTOP` |

### Attachments

`IssueAttachment` — images only (JPEG, PNG, WebP), max **10** per issue, no workspace quota, no thumbnails, no activity log.

Storage key pattern:

```txt
internal/issues/{issueId}/{attachmentId}/original-{fileName}
```

Upload reuses estimate pipeline pieces in `upload-service.ts` → `uploadPreparedIssueAttachments()`.

---

## Status lifecycle

| Status | UI v1 | Local sync (`sync:issues`) |
| --- | --- | --- |
| `OPEN` | Visible, default on create | **Upsert** folder |
| `IN_PROGRESS` | Hidden (set via SQL v1) | **Upsert** folder — folder stays during Cursor analysis |
| `RESOLVED` | Admin can set | **Delete** folder |
| `ARCHIVED` | Hidden (DB only v1) | **Delete** folder |

Typical workflow:

```txt
OPEN (reported) → IN_PROGRESS (analyzing in Cursor) → RESOLVED (fixed)
```

During analysis, developer adds `notes.md` or fix plan under `docs/issues/{number}-{slug}/` — sync preserves non-managed files.

---

## API surface

### Server actions

| Action | File | Auth |
| --- | --- | --- |
| `createIssueAction` | `server/actions.ts` | Logged-in user |
| `listAdminIssuesAction` | `server/admin-actions.ts` | Platform admin |
| `getAdminIssueAction` | `server/admin-actions.ts` | Platform admin |
| `updateIssueStatusAction` | `server/admin-actions.ts` | Platform admin |
| `getIssueAttachmentSignedUrlAction` | `server/admin-actions.ts` | Platform admin |

### HTTP

**`POST /api/attachments/upload`**

FormData branches:

```txt
estimateId + workspaceId + files[]   → existing estimate upload
issueId + files[]                    → issue screenshot upload
```

Issue branch checks:

1. `assertIssueTrackerEnabled()`
2. Authenticated user
3. `uploadPreparedIssueAttachments({ issueId, files, uploadedById })` — reporter must own issue

No dedicated `/api/issues/*` routes in v1.

---

## Local sync (`sync:issues`)

Script: `scripts/sync-issues.mjs` → `scripts/sync-issues.ts`

| Command | Database |
| --- | --- |
| `npm run sync:issues` | Neon **staging** (`DATABASE_URL_STAGING`, `DIRECT_URL_STAGING`) |
| `npm run sync:issues -- --local` | Neon **development** (`DATABASE_URL`) |
| `npm run sync:issues -- --issue=123` | Single issue (must be OPEN or IN_PROGRESS) |
| `npm run sync:issues -- --issue=123,124` | Multiple issues |

Also requires **`UPLOADTHING_TOKEN`** for screenshot download.

Output: **`docs/issues/`** (gitignored).

### Folder layout

```txt
docs/issues/
  open-issues.md                 ← index (full sync only)
  123-mobile-save-loader/
    issue.md                     ← managed — overwritten each sync
    context.json                 ← managed — screenshot cache fingerprints
    screenshot-1.png             ← managed — from UploadThing
    notes.md                     ← manual — preserved
    fix-plan.md                  ← manual — preserved
```

### Upsert rules

- **Managed files:** `issue.md`, `context.json`, `screenshot-*`
- **Preserved:** anything else (e.g. `notes.md`)
- **Screenshot cache:** skip download when `context.json` entry matches `id + storageKey + updatedAt` and local file exists
- **Orphans:** folders on disk not matching any OPEN/IN_PROGRESS issue → removed
- **RESOLVED/ARCHIVED:** folder removed on sync

### Cursor analysis paths

**Path A — instant (no sync):**

1. Admin detail → **Copy Cursor Prompt**
2. Paste into Cursor chat

**Path B — local folder (richer, screenshots on disk):**

1. `npm run sync:issues -- --issue=123`
2. Open `docs/issues/123-…/` in Cursor
3. Add `notes.md` with findings; re-run sync — notes preserved

---

## Module map

```txt
src/features/issues/
  components/
    report-issue-dialog.tsx       Quick capture form
    issue-description-field.tsx   Description + mic
    issue-screenshot-uploader.tsx File picker
    issue-advanced-fields.tsx     Collapsed optional fields
    admin-issues-table.tsx        Admin list
    admin-issue-detail-panel.tsx  Detail + copy buttons
    issue-*-badge.tsx             Status / priority / type badges
  hooks/
    use-speech-recognition.ts
    use-issue-screenshot-upload.ts
  lib/
    issue-context.ts
    slugify-issue-title.ts
    collect-issue-metadata.ts
    build-cursor-prompt.ts
    build-issue-admin-url.ts
    resolve-device-type.ts
  schemas/issue.ts
  server/
    allocate-issue-number.ts
    repository.ts
    actions.ts
    admin-actions.ts

src/lib/issue-tracker/guard.ts
src/lib/app-environment.ts

src/components/layout/app-sidebar/
  sidebar-report-issue.tsx

src/app/[locale]/(dashboard)/dashboard/admin/issues/
  page.tsx
  [number]/page.tsx

scripts/sync-issues.*
scripts/sync-issues/
```

i18n: `src/messages/{pl,en}/issues.json`, sidebar keys in `sidebar.json`.

---

## Configuration

### `.env` / Vercel Preview

```env
# Required to enable UI + API (Preview / localhost only)
ENABLE_ISSUE_TRACKER=true
```

### Local sync (developer `.env`)

```env
DATABASE_URL_STAGING="..."
DIRECT_URL_STAGING="..."
UPLOADTHING_TOKEN="..."
```

See [scripts.md — Issue tracker](../../scripts.md#issue-tracker--sync-do-cursor).

---

## Explicit non-goals (v1)

- Production deployment of tracker UI
- Public or workspace-scoped issue lists for non-admins
- Comments, assignees, notifications, email
- AI analysis or transcription backend (voice is browser-only)
- Separate upload endpoint (`/api/issues/attachments/upload`)
- Title edit / `folderSlug` update
- `fixedIn` in admin UI
- `IN_PROGRESS` / `ARCHIVED` in admin UI
- Workspace storage quota for issue screenshots
- Committing `docs/issues/` to git

---

## Testing checklist

### Preview (after deploy)

- [ ] `ENABLE_ISSUE_TRACKER=true` on Vercel Preview
- [ ] Regular user sees **“Zgłoś błąd”** in sidebar
- [ ] Submit issue with screenshot → success toast with number
- [ ] Non-admin **cannot** open `/dashboard/admin/issues` (redirect)
- [ ] Platform admin sees issue in admin list + detail
- [ ] Copy Cursor Prompt / Copy Issue URL work
- [ ] OPEN → RESOLVED removes issue from sync target

### Local sync

- [ ] `npm run sync:issues -- --issue=N` creates folder under `docs/issues/`
- [ ] Second run skips unchanged screenshot downloads
- [ ] Manual `notes.md` survives re-sync
- [ ] RESOLVED issue → folder deleted on sync

### Guards

- [ ] `ENABLE_ISSUE_TRACKER` unset → no sidebar button, API returns 403
- [ ] `VERCEL_ENV=production` → always disabled regardless of env var

---

## Future (v2+)

- Admin UI for `IN_PROGRESS`, `ARCHIVED`, `fixedIn`
- Deep-link context (`estimateId`, `requestId`) from estimate/request screens
- Filter/search in admin list
- Optional webhook or Linear/GitHub export
- SQL helper to bulk-set `IN_PROGRESS` when starting Cursor session
