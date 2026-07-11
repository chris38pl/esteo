# Admin storage explorer

Platform admin tool for browsing all UploadThing blobs referenced in the database, grouped by workspace and category. Used to audit disk usage, inspect attachment lifecycle, and detect orphans before manual cleanup.

Related: [`estimate-attachments.md`](estimate-attachments.md), [`admin-workspaces.md`](admin-workspaces.md) (per-workspace quota column).

## Access

- Route: `/[locale]/dashboard/admin/storage`
- Guard: `assertPlatformAdminAccess` in `dashboard/admin/layout.tsx`
- Requirement: `User.platformRole === PLATFORM_ADMIN`

Nav entry: sidebar **Admin → Storage explorer** / **Eksplorator plików** (`admin-nav-config.ts`, key `storageExplorer`).

## UI

Client shell: `AdminStorageExplorerPanel` (`src/features/admin-storage/components/admin-storage-explorer-panel.tsx`).

| Area | Behavior |
| --- | --- |
| Summary cards | Quota-counted bytes/files, non-quota bytes/files, workspace count, UT orphan count (after scan) |
| Scan UploadThing | On-demand `UTApi.listFiles` pagination + diff vs DB keys; results cached 5 min in process memory |
| Left tree | Collapsible categories with file count + byte totals per node |
| Right table | Paginated file list for selected leaf node - name, source, size, date, health badge |
| Row actions | Open/download via signed URL, copy storage key, open in context (estimate / request / issue) |

Container nodes (`workspaces`, `platform`, `orphans`, `all`) do not list files - select a workspace or leaf category.

### Tree categories

| Node | DB source | Counted in workspace quota? |
| --- | --- | --- |
| **Workspaces → {name}** | aggregate | partial (see child rows) |
| → Estimate attachments | `EstimateAttachment` (+ thumb row when generated) | yes |
| → Staging (active) | `RequestStagingAttachment` status ∈ UPLOADING/PENDING/FAILED | yes when PENDING |
| → Staging (linked) | status = LINKED | no (same blob as estimate row) |
| → Generated PDFs | `EstimatePdf.fileKey` | no |
| → Workspace logo | `WorkspaceSettings.branding.logoStorageKey` | no |
| **Platform → Issues** | `IssueAttachment` | no |
| **Orphans → UT only** | UploadThing keys not in DB union | - |
| **Orphans → JSON unpromoted** | `EstimateRequest.attachments` JSON without canonical blob ref | maybe |
| **Orphans → Legacy** | keys matching `{wsId}/requests/{requestId}/…` | maybe |
| **Orphans → Duplicate keys** | same `storageKey` in multiple DB rows (excludes expected staging+estimate pairs) | - |

### Health badges

| Status | Meaning |
| --- | --- |
| `ok` | Normal referenced blob |
| `staging_expired` | PENDING staging past 24h TTL |
| `linked_duplicate` | Staging LINKED row or estimate row sharing blob with linked staging |
| `ut_orphan` | In UploadThing, not referenced in any DB column |
| `json_orphan` | Stored in request JSON, not promoted / not in canonical tables |
| `legacy` | Old `requests/{requestId}/` key layout |
| `duplicate_key` | Same storage key referenced by more than one DB row (anomaly) |

v1 is **read-only** - no delete actions in the UI.

## Server

| File | Role |
| --- | --- |
| `server/storage-explorer-repository.ts` | Tree aggregates + paginated lists per tree node |
| `server/storage-explorer-db-keys.ts` | Collect all DB storage keys (estimate, staging, issue, PDF, logo, request JSON) |
| `server/storage-explorer-reconcile.ts` | UploadThing `listAllFiles` + diff; in-memory cache (5 min TTL) |
| `server/storage-explorer-actions.ts` | Server actions - all guarded with `assertPlatformAdminAccess` |
| `lib/storage-explorer-node-ids.ts` | Parse/build tree node IDs |
| `lib/storage-explorer-types.ts` | Shared types for tree, items, reconcile result |

UploadThing listing: `UploadThingStorageProvider.listAllFiles()` in `src/features/attachments/server/storage/uploadthing-provider.ts` - paginates `UTApi.listFiles({ limit: 500, offset })` until `hasMore` is false.

Signed URLs: `getAdminStorageSignedUrlAction` → `getStorageProvider().getSignedUrl(key, { expiresInSeconds: 900 })`.

### Node ID scheme

Used in client state (optional future: `?node=` query param):

```txt
all
workspaces
workspace:{workspaceId}
workspace:{workspaceId}:estimates
workspace:{workspaceId}:estimate:{estimateId}
workspace:{workspaceId}:staging-active
workspace:{workspaceId}:staging-linked
workspace:{workspaceId}:pdfs
workspace:{workspaceId}:logo
platform
platform:issues
platform:issue:{issueId}
orphans
orphans:ut-only
orphans:json-unpromoted
orphans:legacy
orphans:duplicate-keys
```

### DB key union (reconcile)

`collectAllDbStorageKeyRefs()` unions keys from:

- `EstimateAttachment.storageKey` + `thumbnailStorageKey`
- `RequestStagingAttachment.storageKey`
- `IssueAttachment.storageKey`
- `EstimatePdf.fileKey`
- `WorkspaceSettings.branding.logoStorageKey`
- `EstimateRequest.attachments` JSON records

`collectCanonicalBlobStorageKeys()` excludes JSON-only refs - used for JSON orphan detection.

## i18n

- Page copy: `admin.storageExplorer` in `src/messages/{en,pl}/admin.json`
- Sidebar label: `admin.nav.storageExplorer` in `src/messages/{en,pl}/sidebar.json`
- Breadcrumb: `navbar.breadcrumbs.adminStorageExplorer`

## Manual test checklist

1. Platform admin sees **Storage explorer** in Admin sidebar.
2. Tree lists workspaces with plausible file counts vs **Admin → Workspaces** storage column.
3. Workspace → Estimate attachments lists editor/request files; thumbnails appear as separate rows when generated.
4. Staging active vs linked show correct badges.
5. Platform → Issues lists issue tracker screenshots.
6. **Scan UploadThing** populates **Orphans → UT only** (compare with UploadThing dashboard).
7. Row action **Open** returns a working signed URL.
8. Non-admin user is redirected from `/dashboard/admin/*`.

## Future extensions (not implemented)

- Admin delete for expired staging / UT-only orphans (reuse `cleanup-service.ts`, `staging-attachment-cleanup.ts`)
- CSV export of orphan lists
- Scheduled Trigger.dev reconcile job + alerting
- URL sync for selected tree node (`?node=`)
