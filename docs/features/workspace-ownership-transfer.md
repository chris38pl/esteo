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
- `billingOwnershipState === NORMAL` (no unresolved billing handoff)

**Accept** re-checks the same live subscription and workspace conditions, but does **not** block on the pending transfer being accepted (that transfer is expected to exist).

`periodEndSnapshot` on `WorkspaceOwnershipTransfer` is **UI-only** (wizard copy, accept dialog, history). It must never be used for gates, accept validation, or auto-cancel logic.

## Flow

1. Owner cancels subscription at period end on the billing page (`cancelAtPeriodEnd = true`).
2. Owner initiates transfer (email + `keepSenderAsMember`, default `true`) after Clerk reverification.
3. Recipient accepts or declines via inbox or `/dashboard/transfer/[token]`.
4. On accept: `ownerId` swap, membership update, transfer `COMPLETED`. **`payerUserId` unchanged** (sender remains Stripe payer). Canonical owner is `Workspace.ownerId` only (`BillingAccount.ownerUserId` is deprecated). No Stripe calls.
5. On decline: transfer `CANCELLED` with audit `transfer_cancelled` (`reason: declined_by_recipient`). Recipient with no workspace is redirected to onboarding.
6. Workspace remains usable until `currentPeriodEnd` on the original subscription.
7. After period end: `billing_handoff_expired` audit + `handoffExpiredAt` set; new owner may buy a new plan.

## Billing handoff lifecycle

Derived state via `deriveBillingOwnershipState()` (not stored in DB):

| State | Conditions |
| ----- | ---------- |
| `NORMAL` | `owner === payer`, or 90-day timeout elapsed, or standard FREE |
| `HANDOFF_ACTIVE` | `owner !== payer` + paid sub ACTIVE/TRIAL |
| `HANDOFF_EXPIRED` | `owner !== payer` + EXPIRED + within 90 days of `handoffExpiredAt` |

**`NORMAL` descriptive variants** (same enum):

- **NORMAL (owner-managed):** owner === payer, active billing
- **NORMAL (free / no active payer):** FREE or post-timeout — `owner !== payer` may still be true in DB (`payerUserId` kept for audit)

**Active billing payer:** `activeBillingPayerId` (derived). Never compare `userId === payerUserId` for permissions outside audit.

### Permission matrix

| State | Owner (non-payer) | Payer | Members |
| ----- | ----------------- | ----- | ------- |
| `HANDOFF_ACTIVE` | View, read-only | Portal, cancel, resume only | No billing |
| `HANDOFF_EXPIRED` | View + purchase checkout | No access | No billing |
| `NORMAL` | Per owner/payer alignment | Full manage when active payer | No billing |

During `HANDOFF_ACTIVE`, **plan changes and add-ons are blocked for everyone** (including payer).

### Post-expiry checkout

- Only `workspace.ownerId` may initiate checkout (`assertCanPurchaseSubscription`)
- Checkout metadata includes `ownerUserId` snapshot; validated in `checkout-success`
- On success: `payerUserId` reassigned to owner, `billing_handoff_completed` audit, ex-payer cut off

### 90-day lazy cleanup

If `HANDOFF_EXPIRED` unresolved >90 days from `handoffExpiredAt`:

1. Workspace → FREE
2. `billing_handoff_timed_out` audit **before** clearing `handoffExpiredAt` (snapshot date + `payerUserId`)
3. `handoffExpiredAt = null`; `payerUserId` unchanged

Triggered lazily on dashboard layout, `/billing*`, transfer eligibility (`resolveStaleBillingHandoff`).

Timeout is derived: `handoffExpiredAt < now - 90 days` (no `handoffTimedOut` column).

## Payer access without membership

**Billing payer may access billing pages even if no longer a workspace member** during `HANDOFF_ACTIVE`.

Non-member payers reach billing via direct URL or **Account → Billing → Subscriptions you pay for** (`listWorkspacesWhereUserIsBillingPayer`).

After handoff completes or times out, ex-payer loses all billing access to the workspace.

## Server guards

- `assertCanManageBilling` — portal, cancel, resume
- `assertCanChangePlanOrAddons` — plan + add-ons
- `assertCanPurchaseSubscription` — post-expiry checkout (owner only)
- `resolveWorkspaceForBilling` for `/billing*` routes

## Auto-cancel pending transfer

When `cancelAtPeriodEnd` changes from `true` → `false` (subscription reactivated), any `PENDING_RECIPIENT` transfer is set to `CANCELLED` with audit `transfer_cancelled` (`reason: subscription_reactivated`). Hook: `subscription-sync.ts` → `cancelPendingTransferIfSubscriptionReactivated`.

## Delete vs transfer

- `HANDOFF_ACTIVE` → delete blocked
- `HANDOFF_EXPIRED` → delete allowed for current owner
- PRO/BUSINESS with `cancelAtPeriodEnd === false` → delete blocked
- Pending ownership transfer → delete blocked

## Audit events

**Ownership transfer:**

- `transfer_initiated`, `transfer_accepted`, `transfer_cancelled`, `transfer_expired`

**Billing handoff** (`entityType: BillingHandoff`):

- `billing_handoff_started` — accept when `payerUserId !== newOwnerId`
- `billing_handoff_expired` — subscription EXPIRED during handoff
- `billing_handoff_completed` — owner purchased after EXPIRED
- `billing_handoff_timed_out` — 90-day lazy cleanup (before `handoffExpiredAt` clear)

## Key files

| Area | Path |
| ---- | ---- |
| Schema | `prisma/schema.prisma` — `WorkspaceOwnershipTransfer`, `BillingAccount.handoffExpiredAt` |
| Eligibility | `src/features/workspaces/server/transfer-eligibility.ts` |
| Service | `src/features/workspaces/server/ownership-transfer.ts` |
| Billing logic | `src/features/billing/lib/billing-permissions-logic.ts` |
| Billing guards | `src/features/billing/server/billing-permissions.ts` |
| Lazy cleanup | `src/features/billing/server/billing-handoff-cleanup.ts` |
| Tests | `scripts/verify-workspace-transfer.ts`, `scripts/verify-billing-authorization.ts` |

## Security

- Initiate: OWNER only + `workspace.ownerId === actor.id` + Clerk reverification (`strict`)
- Accept: signed-in user, email match, token valid, live eligibility re-check
- Transfer blocked while `billingOwnershipState !== NORMAL`
- One pending transfer per workspace (partial unique index)
- Transfer TTL: 7 days
