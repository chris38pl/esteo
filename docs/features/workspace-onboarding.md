# Workspace onboarding

This document describes MVP workspace onboarding, explicit invitation acceptance, active workspace resolution, and dashboard routing guards.

## Mental model

Onboarding exists only for **founders with zero accessible workspaces and no pending invitations**. Invited employees must never be pushed into organization creation.

| User | Experience |
| --- | --- |
| Founder (no invites, no access) | `/dashboard/onboarding` — create organization |
| Invited user (zero accessible workspaces) | `/dashboard/invitations` — explicit accept/decline |
| Existing member with new invite | Dashboard + one-at-a-time invitation modal |
| Existing member | Dashboard directly |

## Accessible workspace

A workspace the user can enter **right now**:

```
accessible workspace =
  (workspace.ownerId = userId)   // owner path — independent of membership row
  OR
  (active WorkspaceMember for userId)
  AND workspace.deletedAt IS NULL
```

**Owner access does not depend on a `WorkspaceMember` row.** `getAccessibleWorkspaces()` always includes the `ownerId` path independently of membership joins. `requireWorkspace()` treats `ownerId` as `OWNER` even when no membership row exists.

Implementation: `src/features/workspaces/server/accessible-workspaces.ts`

`getAccessibleWorkspaces` is wrapped in React `cache()` so `(dashboard)/layout.tsx` and `checkDashboardHomeAccess` in nested layouts share one DB round-trip per request. Do not remove `cache()` without re-auditing concurrent post-login RSC load. See [incident: blank dashboard / Rendering after login](../incidents/2026-06-01-blank-dashboard-rendering-after-login.md).

### Leaving a workspace

- **Non-owner members** (MEMBER/VIEWER) can leave via the sidebar workspace card menu → soft-deletes their `WorkspaceMember` row
- **Owners** cannot leave; they must delete (archive) the workspace instead — Settings → General → Delete workspace
- After leaving or deleting, active workspace cookie/DB is reconciled; if no accessible workspaces remain, routing falls back to invitations or onboarding

### Deleting a workspace (owner archive)

- Soft delete only (`deletedAt`); related estimates and audit logs are retained
- Pending invitations are revoked; members lose access on next request
- Workspace URL slug is **not** freed for reuse (see slug rules in `docs/architecture/database.md`)

## Invitation acceptance (explicit)

Invitations are **not** auto-accepted on login. Users must accept or decline each invitation.

Implementation: `src/features/workspaces/server/invitation-inbox.ts`, `src/features/workspaces/server/service.ts`

### Modal queue (one at a time)

When the user has at least one accessible workspace, pending invitations with `promptDismissedAt IS NULL` are shown in a login modal, **one at a time**, ordered by `createdAt ASC`.

"Don't ask again" sets `promptDismissedAt` on that invitation only. The invitation remains visible in the account inbox (`/dashboard/account`).

### Accept checks

Accepting runs two entitlement checks (either can fail with different UX):

1. **Invitee plan** — `assertCanAcceptInvitation(userId)` → user's `maxAccessibleWorkspaces`
2. **Owner workspace seats** — `assertCanInviteMember(workspaceId)` → owner's `maxInvitedSeats`

Failure copy:

- Invitee limit → upgrade billing CTA
- Owner seat limit → contact workspace owner (no invitee billing upsell)

### Decline

Decline sets invitation status to `DECLINED` (permanent for that invitation).

## Plan entitlements (invitations)

| Plan | maxInvitedSeats (owner sends) | maxAccessibleWorkspaces (invitee joins) |
| --- | --- | --- |
| FREE | 0 | 1 |
| PRO | 3 | 3 |
| BUSINESS | unlimited | unlimited |

Implementation: `src/server/permissions/entitlements.ts`

FREE workspace owners cannot send invites (UI gated in settings + server enforcement).

**Note:** Invite seat checks use the **workspace owner's** subscription (via `Workspace.billingAccountId`). Invitee limits and all plan **display** use the **logged-in user's** subscription.

## Dashboard routing

| Condition | Route |
| --- | --- |
| `accessible > 0` | `/dashboard` |
| `accessible === 0` + pending invites | `/dashboard/invitations` |
| `accessible === 0` + no pending | `/dashboard/onboarding` |

Guards: `src/server/workspaces/dashboard-route.ts`

- `(main)/layout.tsx` — requires accessible workspaces
- `onboarding/layout.tsx` — founders only; redirects invitees with pending invites to `/dashboard/invitations`
- `invitations/layout.tsx` — users with zero accessible workspaces and pending invites
- `/dashboard/pending-access` — deprecated; redirects to `/dashboard/invitations`

## Active workspace resolution

Cookie: `esteo_active_workspace` (httpOnly, set via server action only).

DB fallback: `User.lastActiveWorkspaceId` (updated on every switch).

Resolution chain (`resolveActiveWorkspace` in `src/server/workspaces/active-workspace.ts`):

1. Cookie if workspace is accessible
2. `User.lastActiveWorkspaceId` if accessible
3. First **owned** workspace (`createdAt ASC`)
4. First membership-only workspace (`createdAt ASC`)

### Invalid active workspace recovery

If cookie or `lastActiveWorkspaceId` points to an inaccessible workspace (deleted, membership removed, ownership lost):

1. **During render (layouts):** ignore stale cookie/DB values and fall through the resolution chain — no cookie mutation (Next.js only allows cookie writes in Server Actions or Route Handlers).
2. **During Server Actions:** `reconcileStaleActiveWorkspace()` clears invalid cookie and `lastActiveWorkspaceId`, then `persistActiveWorkspace()` sets the new active workspace.

Never serve dashboard content against an inaccessible workspace ID.

Switch: `setActiveWorkspaceAction` in `src/server/workspaces/actions.ts`

## Workspace creation (onboarding)

- Route: `/dashboard/onboarding`
- Fields: name (required), industry (required enum), industryOtherText (required when industry = Other), companyDescription (optional, max 600 chars)
- Industry is **immutable** after workspace creation
- Slug: auto-generated from name, not editable
- Slug collision: silent suffix retry (`acme`, `acme-2`, `acme-3`, …) in `createWorkspace`

After create: set active workspace cookie + `lastActiveWorkspaceId`, redirect to the estimates list (`/dashboard/[slug]/estimates` for onboarding; `/dashboard/[slug]` for additional workspaces).

## Workspace settings

- Route: `/[locale]/dashboard/[workspaceSlug]/settings` (workspace **owner** only)
- Tabs: **General**, **Company** (`?tab=company`), Users, Rules
- General: workspace name, appearance theme, `companyDescription` (AI context), company logo upload
- Company (Dane): optional address, NIP, email, phone for client documents / future PDF — see [workspace-branding-and-company-profile.md](workspace-branding-and-company-profile.md)
- Rules tab also contains **estimate section templates**:
  - Defaults are derived from immutable `Workspace.industry` (shipped in `src/features/workspaces/config/industry-estimate-sections.ts`)
  - Workspaces can override section list (rename, reorder — drag & drop on desktop, up/down on mobile, toggle active, add/remove) under settings → Rules
  - Overrides are stored in `WorkspaceSettings.branding.estimateSections` and injected into AI prompt context (`## Estimate structure` + `## Section-specific rules`)
- Member invites: gated on owner plan (`maxInvitedSeats > 0`)

## Account inbox

- Route: `/dashboard/account`
- Lists all pending received invitations (including those dismissed from the modal)
- Navbar badge shows pending invitation count

## Future: email invite links

Deferred. Planned flow: `GET /[locale]/invite/[token]` → sign-in → accept flow using `WorkspaceInvitation.token`.

## Sidebar workspace switcher

- Lists accessible workspaces from server
- Switch via `setActiveWorkspaceAction` + `router.refresh()`
- No `localStorage` tenancy authority
