# Workspace ownership transfer

Ownership transfer moves **workspace ownership** (`Workspace.ownerId`) and membership to a new user. It does **not** transfer billing responsibility or Stripe subscriptions.

## Product rules

| Included | Not included |
| -------- | ------------ |
| Ownership (`ownerId`) | Stripe subscription transfer |
| Data, history, configuration | Checkout / billing takeover |
| Membership per `keepSenderAsMember` | Payer migration |

After `currentPeriodEnd`, the existing billing lifecycle applies (`EXPIRED`, etc.). The new owner may purchase a subscription on `/billing`.

## Eligibility (live data only)

Transfer can be **initiated** only when all conditions are met from **live** `Subscription` + `getWorkspaceEffectiveStatus()`:

- `plan ∈ { PRO, BUSINESS }`
- `cancelAtPeriodEnd === true`
- `currentPeriodEnd > now()`
- `effectiveStatus === ACTIVE`
- No other `PENDING_RECIPIENT` transfer for the workspace

**Accept** re-checks the same live subscription and workspace conditions, but does **not** block on the pending transfer being accepted (that transfer is expected to exist).

`periodEndSnapshot` on `WorkspaceOwnershipTransfer` is **UI-only** (wizard copy, accept dialog, history). It must never be used for gates, accept validation, or auto-cancel logic.

## Flow

1. Owner cancels subscription at period end on the billing page (`cancelAtPeriodEnd = true`).
2. Owner initiates transfer (email + `keepSenderAsMember`, default `true`) after Clerk reverification.
3. Recipient accepts or declines via inbox or `/dashboard/transfer/[token]`.
4. On accept: `ownerId` swap, membership update, transfer `COMPLETED`. No Stripe calls.
5. On decline: transfer `CANCELLED` with audit `transfer_cancelled` (`reason: declined_by_recipient`). Recipient with no workspace is redirected to onboarding.
6. Workspace remains usable until `currentPeriodEnd` on the original subscription.
7. After period end: standard expiry; new owner may buy a new plan.

## Recipient inbox and routing

Ownership transfers appear in the **in-app inbox** (no email in v4.1):

- `/dashboard/invitations` — full hub (member invitations + ownership transfers)
- `/dashboard/account` — profile tab inbox preview
- User menu badge counts both invitation types via `countPendingInboxItems`

Routing rules (`dashboard-route.ts`):

- New users with **no workspace** but a pending transfer are sent to `/dashboard/invitations`, not `/onboarding`.
- Users **with** an existing workspace can still open `/dashboard/invitations` when they have a pending transfer.
- `syncUserFromClerk` links pending transfers to the user record by email on first login.

## Auto-cancel pending transfer

When `cancelAtPeriodEnd` changes from `true` → `false` (subscription reactivated), any `PENDING_RECIPIENT` transfer is set to `CANCELLED` with audit `transfer_cancelled` (`reason: subscription_reactivated`). Hook: `subscription-sync.ts` → `cancelPendingTransferIfSubscriptionReactivated`.

## Delete vs transfer

Deleting (archiving) a workspace is allowed only when it cannot cause a renewing paid subscription to keep charging without a workspace to use.

- If the workspace has a PRO/BUSINESS subscription with `cancelAtPeriodEnd === false`, deletion is blocked. The owner must cancel the subscription first.
- If there is a `PENDING_RECIPIENT` ownership transfer, deletion is blocked until the transfer is cancelled or completed.

## Audit events

- `transfer_initiated`
- `transfer_accepted`
- `transfer_cancelled` (owner cancel, subscription reactivated, or recipient decline)
- `transfer_expired` (via `expireStalePendingTransfers`)

## Key files

| Area | Path |
| ---- | ---- |
| Schema | `prisma/schema.prisma` — `WorkspaceOwnershipTransfer` |
| Eligibility | `src/features/workspaces/server/transfer-eligibility.ts` |
| Service | `src/features/workspaces/server/ownership-transfer.ts` |
| Actions | `src/features/workspaces/server/actions.ts` |
| Settings UI | `workspace-settings-transfer-section.tsx`, `workspace-transfer-wizard.tsx` |
| Inbox | `workspace-transfer-card.tsx`, `dashboard/transfer/[token]/page.tsx`, `inbox-state.ts` |
| User linking | `src/server/auth/sync-user.ts` |

## Security

- Initiate: OWNER only + `workspace.ownerId === actor.id` + Clerk reverification (`strict`)
- Accept: signed-in user, email match, token valid, live eligibility re-check
- One pending transfer per workspace (partial unique index)
- Transfer TTL: 7 days
