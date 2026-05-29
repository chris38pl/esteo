# Workspace onboarding

This document describes MVP workspace onboarding, invitation auto-acceptance, active workspace resolution, and dashboard routing guards.

## Mental model

Onboarding exists only for **founders with zero accessible workspaces**. Invited employees must never be pushed into organization creation.

| User | Experience |
| --- | --- |
| Founder (no invites, no access) | `/dashboard/onboarding` — create organization |
| Invited employee (seats available) | Auto-accept on login → dashboard |
| Invited employee (seat limit) | `/dashboard/pending-access` |
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

## Invitation auto-acceptance

Runs during `syncUserFromClerk()` after `ensureBillingAccount()`.

Implementation: `src/features/workspaces/server/auto-accept-invitations.ts`

### Processing order (invariant)

Pending invitations are queried and processed **`ORDER BY createdAt ASC`**. This order must remain stable for predictable seat assignment and debugging. Do not introduce unordered processing.

### Algorithm

1. Load pending invitations (email match, not expired, workspace not deleted) in `createdAt ASC` order.
2. For each invitation:
   - If already an active member → mark `ACCEPTED` if still pending (idempotent).
   - Run `assertCanInviteMember(workspaceId)`.
   - On seat limit → record in `seatLimitBlocked`.
   - Otherwise upsert member and mark invitation `ACCEPTED`.

Safe to run on every login.

## Pending-access edge case

When `accessibleWorkspaces.length === 0` and pending invitations exist but **all** fail seat limits, redirect to `/dashboard/pending-access` instead of onboarding.

Fresh DB check: `hasSeatBlockedPendingInvite(email)` in `auto-accept-invitations.ts`.

## Dashboard routing

| Condition | Route |
| --- | --- |
| `accessible > 0` | `/dashboard` |
| `accessible === 0` + seat-blocked invites | `/dashboard/pending-access` |
| `accessible === 0` otherwise | `/dashboard/onboarding` |

Guards: `src/server/workspaces/dashboard-route.ts`

- `(main)/layout.tsx` — requires accessible workspaces
- `onboarding/layout.tsx` — founders only, not seat-blocked
- `pending-access/layout.tsx` — seat-blocked invitees only

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
- Fields: name (required), industry (optional)
- Slug: auto-generated from name, not editable
- Slug collision: silent suffix retry (`acme`, `acme-2`, `acme-3`, …) in `createWorkspace`

After create: set active workspace cookie + `lastActiveWorkspaceId`, redirect to dashboard.

## Sidebar workspace switcher

- Lists accessible workspaces from server
- Switch via `setActiveWorkspaceAction` + `router.refresh()`
- No `localStorage` tenancy authority
