# Global search (command palette)

## Goal

Workspace-scoped command palette (Ctrl/Cmd+K) to find estimates, inquiries, and attachments quickly. V1 uses a PostgreSQL `SearchDocument` index with ILIKE — no Meilisearch / FTS.

---

## UX

| Element | Behavior |
| --- | --- |
| Trigger | Navbar button, sidebar search field, **Ctrl/Cmd+K** |
| Debounce | 300 ms, minimum 2 characters |
| Layout | Full-width search bar; results ~62% left; recents ~38% right; footer with hint + keyboard shortcuts |
| Empty state | Hint on the left; recent searches (localStorage) + recently opened (DB) on the right |
| Recent documents | Synced per user/workspace in `UserRecentDocument`; URLs built dynamically (no `urlSnapshot`) |
| Recent searches | `localStorage`, max 10 per workspace |
| Attachment results | Navigate to `?tab=attachments` on estimate editor |

### Search bar styling

The palette search input **must not** use global dark field chrome (`.dark input` in `globals.css`). It uses `data-slot="command-input"` and is excluded via `:not([data-slot="command-input"])`.

Visual states live on the **wrapper** only:

- Default: transparent border/background (blends with dialog)
- Hover: subtle border + `bg-muted/20`
- Focus (`focus-within`): primary border, muted background, thin ring shadow

Input stays fully transparent; no `cmdk-input-wrapper` in the palette.

---

## Data model

### `SearchDocument`

Workspace index row per entity (`ESTIMATE`, `INQUIRY`, `ATTACHMENT`). Soft delete via `deletedAt`. `workspaceSlugSnapshot` for future multi-workspace display only.

### `UserRecentDocument`

Per-user snapshots: `titleSnapshot`, `subtitleSnapshot`, `iconTypeSnapshot`. **No URL stored** — `buildSearchUrl()` at read/navigate time.

---

## Indexing

Fire-and-forget after successful business transactions (never inside `$transaction`):

```ts
scheduleSearchIndex({ workspaceId, entityType, entityId, run: () => upsert... });
```

In-memory `pending` Set deduplicates in-flight upserts per `(workspaceId, entityType, entityId)`.

**Hooks:** estimate create/title, inquiry submit/convert, attachment upload/promote/delete, admin archive/restore, `generate-estimate-draft` success.

**Backfill:** `npm run prisma:backfill-search-index`

---

## Module layout

```txt
src/features/search/
├── components/     # GlobalSearchDialog, provider, navbar button
├── hooks/          # recent documents cache (60s TTL)
├── lib/            # buildSearchUrl, build-search-document, recent-searches
└── server/         # index-service, repository (ILIKE), actions
```

---

## i18n

Namespace `search` — `src/messages/{pl,en}/search.json`, registered in `src/i18n/messages.ts`.

---

## Related

- Plan: global search V1 (command palette)
- Incident pattern: global `.dark input` styles vs palette — see exclusion in `src/app/globals.css` (`MINIMAL PREMIUM FIELDS`)
