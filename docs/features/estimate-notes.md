# Estimate notes (internal threaded comments)

> **Status:** Implemented. UI entry: estimate editor → **Notatki** / **Notes** tab - see [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md).

## Goal

Give workspace members a lightweight place for **internal discussion** on an estimate - context, handoffs, and decisions that should not live in line items or the AI chat.

This is **not** a messaging product, Slack clone, or activity feed. Notes are plain text, scoped to the estimate, and visible only inside the dashboard.

---

## Where it lives

| Surface | Location |
| --- | --- |
| Tab | Estimate editor → **Notatki** (PL) / **Notes** (EN) |
| Route | `/[locale]/dashboard/[workspaceSlug]/estimates/[estimateId]` |

The Notes tab is independent of the **Kosztorys** (items) tab and of estimate **version** selection. Switching versions does not change the note thread.

---

## User-facing behavior

### Post a note

- Any workspace member with at least **VIEWER** role can add a top-level note.
- Body: plain text, 1–2000 characters (trimmed).
- Author is shown with avatar, display name (fallback: email), and `createdAt` timestamp.
- Notes are **immutable** in MVP - there is no edit action.

### Reply

- Users can reply to a **top-level note** only (one indent level).
- Replies appear nested under the parent note with a left border.
- Replies do **not** offer a further “Reply” action (no reply-to-reply).

### Delete

- Users can delete **only their own** notes or replies.
- Deletion is **permanent** (hard delete) - no recovery, no audit trail of removed content.
- Deleting a **top-level note** also removes **all replies** in that thread (database cascade). The UI warns when confirming delete on a note that has replies.

### Empty state

When no notes exist, the tab shows a short empty-state message and the top-level composer.

---

## Scope and permissions

| Aspect | Rule |
| --- | --- |
| **Data scope** | One thread per **estimate** (`estimateId`), shared across all versions |
| **Workspace access** | `requireRole(..., "VIEWER")` - VIEWER, MEMBER, and OWNER can read, post, and reply |
| **Authorization path** | `EstimateNote` → `Estimate` → `Workspace` (no `workspaceId` stored on the note row) |
| **Version read-only** | Archived / read-only versions do **not** block notes - collaboration stays enabled |

`workspaceId` is passed into server actions only for permission checks and path revalidation; it is not denormalized onto `EstimateNote`.

---

## Threading model

```txt
Estimate
└── Note A (parentId = null)
    ├── Reply A1 (parentId = A)
    └── Reply A2 (parentId = A)
└── Note B (parentId = null)
```

Server validation on create:

- If `parentId` is set, the parent must exist on the same estimate.
- The parent must be top-level (`parent.parentId === null`).

---

## Data model

Prisma model `EstimateNote`:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | CUID |
| `estimateId` | `String` | FK → `Estimate`, `onDelete: Cascade` |
| `parentId` | `String?` | FK → `EstimateNote`, `onDelete: Cascade` |
| `authorUserId` | `String` | FK → `User`, `onDelete: Restrict` |
| `body` | `String` | `@db.Text` |
| `createdAt` | `DateTime` | No `updatedAt` |

Indexes: `(estimateId, createdAt)`, `(parentId)`.

Migration: `prisma/migrations/20260605120000_estimate_notes/`.

---

## Server API

Isolated from existing estimate CRUD (`actions.ts` / `service.ts` / `repository.ts`).

| Action | File | Purpose |
| --- | --- | --- |
| `createEstimateNoteAction` | `notes-actions.ts` | Create top-level note or reply |
| `deleteEstimateNoteAction` | `notes-actions.ts` | Hard-delete own note/reply |

Flow: `requireAuth` → `requireRole(VIEWER)` → `assertEstimateInWorkspace` → repository → `revalidateEstimatePaths`.

### Repository (`notes-repository.ts`)

| Function | Purpose |
| --- | --- |
| `listNotesByEstimateId` | Load all notes for editor SSR |
| `assertEstimateInWorkspace` | Ensure estimate belongs to workspace |
| `createEstimateNote` | Insert with parent validation |
| `deleteEstimateNote` | Author-only hard delete |

### Validation (`schemas/estimate-note.ts`)

- Zod schema: `body` trimmed, 1–2000 chars; optional `parentId` (CUID).

### Serialization (`serialize-estimate-notes.ts`)

Flat DB rows → client tree: top-level notes with `replies[]` (leaf nodes only).

---

## UI components

| Component | Role |
| --- | --- |
| `EstimateNotesPanel` | Tab content: composer, list, local state after mutations |
| `EstimateNoteItem` | Single note/reply row: avatar, body, reply/delete actions |
| `EstimateNoteComposer` | Textarea + submit (top-level and inline reply) |

Initial data is loaded on the estimate editor page and passed as `initialNotes`. After create/delete, the panel updates local state; server cache is revalidated via actions.

### i18n

Keys under `estimates.editor.notes.*` in `src/messages/pl/estimates.json` and `src/messages/en/estimates.json`.

---

## Out of scope (MVP and beyond)

- Edit note body
- `updatedAt` / edit timestamps
- Soft delete / `deletedAt`
- Reply-to-reply (deeper nesting)
- Reactions, @mentions, notifications, read states
- Moderation (delete others’ notes)
- Real-time updates (WebSocket / polling)
- Rich text, attachments, or links preview
- Client-facing or public notes

---

## Related

- [`estimates.md`](estimates.md) - estimate product overview
- [`estimates-view-edit-ui.md`](estimates-view-edit-ui.md) - editor tabs and layout
- [`database.md`](../architecture/database.md) - broader schema standards
