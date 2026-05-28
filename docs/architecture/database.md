# Workspace & Billing Domain

This document reflects the implemented MVP schema. Plan limits and entitlements are resolved from `BillingAccount` → `Subscription`, never from `Workspace`.

## Subscription semantics (MVP)

**FREE plan uses `SubscriptionStatus.ACTIVE` in MVP.**

- `ACTIVE` means the subscription record is **usable** for feature gating (together with `plan`).
- `ACTIVE` does **not** mean the customer is on a paid Stripe subscription.
- Paid access is determined by `plan` (`PRO`, `BUSINESS`) and `status IN (ACTIVE, TRIAL)`.
- Stripe-synced subscriptions follow the same status enum; FREE accounts are created with `plan: FREE`, `status: ACTIVE`.

## Workspace

```ts
Workspace {
  id
  billingAccountId
  ownerId
  name
  slug              // lowercase, immutable in MVP — use normalizeWorkspaceSlug()
  industry          // String? — see note below
  defaultLocale     // WorkspaceLocale enum (PL | EN)
  deletedAt         // soft delete only in MVP
  createdAt
  updatedAt
}
```

### `industry` field

**Current (MVP):** optional free-form string (`industry String?`).

**Future:** migrate to an enum once industry verticals and AI branch prompts stabilize. Enum migration is intentionally deferred to avoid churn during MVP prompt iteration.

### Slug rules

- Normalize via `src/features/workspaces/lib/slug.ts` (`normalizeWorkspaceSlug`).
- Lowercase, URL-safe, unique.
- **Immutable after creation** in MVP (no rename endpoint).

## Roles

### Workspace roles (`WorkspaceRole`)

Used on `WorkspaceMember` only:

```
OWNER > MEMBER > VIEWER
```

Rank comparison lives in `src/server/permissions/roles.ts`.

### Invitation roles (`InviteRole`)

Used on `WorkspaceInvitation` only:

```
MEMBER | VIEWER
```

**OWNER cannot be invited.** Invitations use a separate enum so invalid owner invites are impossible at the schema level.

Map invite → member role with `inviteRoleToWorkspaceRole()` in `src/features/workspaces/lib/invite-role.ts`.

## Platform admin

`User.platformRole = PLATFORM_ADMIN` is a **global** role only.

- Never stored as a `WorkspaceRole`.
- Never shown in workspace member lists or invite UI (`filterWorkspaceMembersForUi`).
- Bypasses tenant checks on internal/admin routes only.

## WorkspaceRule prompt ordering

Active rules are appended to AI prompts in deterministic order:

1. `active = true`
2. Optional locale filter (match workspace/request locale or `null` = all)
3. `sortOrder ASC`, then `createdAt ASC`
4. Concatenate `title` + `content`

Implemented in `listActiveWorkspaceRules()` (repository).

## Billing ownership

- One `BillingAccount` per paying user (MVP: 1:1 with `User`).
- `Subscription` is attached to `BillingAccount`, not `Workspace`.
- Workspace count limits apply to **owned** workspaces (`Workspace.ownerId`), not external memberships.

## Related entities

- `WorkspaceSettings` — branding JSON + `aiInstructions` (1:1)
- `WorkspaceInvitation` — email invites with `InviteRole`
- `BillingAccountUsagePeriod` — Phase 2 quota counters
- `AuditLog` — Phase 3 change tracking

---

# Core Entities (estimates)

## User

```ts
User {
  id
  email
  clerkId
  name?
  avatarUrl?
  platformRole   // NONE | PLATFORM_ADMIN
  createdAt
  updatedAt
}
```

## EstimateRequest

```ts
EstimateRequest {
  id
  workspaceId
  customerData
  projectDescription
  attachments
  status
  estimateId
  aiMetadata
  createdAt
  updatedAt
  deletedAt?
}
```

## Estimate

```ts
Estimate {
  id
  workspaceId
  aiMetadata
  currency
  createdAt
  updatedAt
  deletedAt?
}
```

---

# Database Setup

- PostgreSQL + Prisma
- `DATABASE_URL` (pooler) and `DIRECT_URL` (direct) must target the **same Neon branch**

# Database Standards

Every business entity MUST contain:

- `workspaceId` (where applicable)
- `createdAt`
- `updatedAt`

## Must Have

### Soft Deletes

```ts
deletedAt DateTime?
```

### Audit Logs

Track changes, actor, timestamps (Phase 3 enforcement).

### Versioning

Support estimate snapshots.

### IDs

Recommendation: CUID

### Timestamps

Every entity: `createdAt`, `updatedAt`
