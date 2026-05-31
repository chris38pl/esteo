# Admin workspaces

Platform-wide browser for active workspaces. Lets platform admins inspect usage, rename workspaces, invite members, and soft-delete workspaces they do not own.

## Access

- Route: `/[locale]/dashboard/admin/workspaces`
- Guard: `assertPlatformAdminAccess` in `dashboard/admin/layout.tsx`
- Requirement: `User.platformRole === PLATFORM_ADMIN`

Nav entry: sidebar **Admin → Workspaces** (`admin-nav-config.ts`).

## UI

Client panel: `AdminWorkspacesPanel` (`src/features/workspaces/components/admin-workspaces-panel.tsx`).

| Area | Behavior |
|------|----------|
| Page header | Title + subtitle (i18n: `admin.workspaces`) |
| Search | Filters by name, slug, owner name/email |
| List header | “All workspaces” (left), “Add new workspace” → `/dashboard/workspaces/new` (right) |
| Row | Themed letter icon, name, owner + created/updated times, estimate request count, estimate count, member avatars + invite `+`, actions menu |

Row actions (⋯ menu or member `+`):

- **Rename** — name + slug
- **Invite** — email, role `MEMBER`, 7-day expiry
- **Delete** — soft-delete (see below)

## Server

| File | Role |
|------|------|
| `server/admin-workspaces.ts` | List + admin mutations |
| `server/admin-actions.ts` | Server actions + path revalidation |
| `server/get-active-workspace-card-data.ts` | `WorkspaceMemberPreview` type reused for avatar stack |

`listAdminWorkspaces()` returns non-deleted workspaces with owner, counts (`estimateRequests`, `estimates`, active members), up to 4 member previews, and `appearanceTheme`.

All mutations call `assertPlatformAdminUser` and write audit events (`admin_updated`, `admin_archived`, `admin_created` on invitations).

## Delete behavior

Admin delete uses the same soft-delete path as owner delete:

1. Revoke pending invitations
2. Set `Workspace.deletedAt`
3. Members lose access; slug is not reused ([ADR 001](../adr/001-workspace-deletion-and-slug-policy.md))

## i18n

Namespace: `admin.workspaces` in `src/messages/{en,pl}/admin.json`.

Nested routes under `(dashboard)` resolve locale via `resolveRequestLocale()` (`src/i18n/request-locale.ts`) so server-rendered headings match the URL locale.

## Related

- [`docs/features/workspace-onboarding.md`](workspace-onboarding.md) — workspace creation flow
- [`docs/adr/001-workspace-deletion-and-slug-policy.md`](../adr/001-workspace-deletion-and-slug-policy.md) — deletion + slug rules
