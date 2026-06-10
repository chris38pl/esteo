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
  industry          // WorkspaceIndustry enum — required, immutable after create
  industryOtherText // String? — required when industry = OTHER (analytics)
  defaultLocale     // WorkspaceLocale enum (PL | EN)
  deletedAt         // soft delete only in MVP
  createdAt
  updatedAt
}
```

### `industry` field

**Current:** required `WorkspaceIndustry` enum (`CONSTRUCTION`, `ELECTRICAL`, `CARPENTRY`, `PLUMBING`, `OTHER`).

- Set at workspace creation only — **immutable** after create (no update path in service layer).
- When `industry = OTHER`, `industryOtherText` stores the free-text description for analytics.

### Industry field catalog & document values

Platform-admin configurable definitions scoped by **industry + document type**:

```ts
IndustryFieldDefinition {
  industry     // WorkspaceIndustry
  documentType // ESTIMATE_REQUEST | ESTIMATE
  key          // stable slug, e.g. property_type
  valueType    // TEXT | NUMBER | DATE | BOOLEAN | SELECT
  options      // JSON for SELECT options
  translations // PL/EN labels via IndustryFieldTranslation
}
```

Document values use typed EAV columns (one populated column per row, based on definition `valueType`):

```ts
DocumentFieldValue {
  documentType  // BusinessDocumentType
  documentId    // e.g. estimateRequestId
  fieldKey      // matches definition key
  valueText     // TEXT, SELECT
  valueNumber   // NUMBER (Decimal)
  valueDate     // DATE
  valueBoolean  // BOOLEAN
}
```

See `docs/features/industry-fields.md`.

### Slug rules

- Normalize via `src/features/workspaces/lib/slug.ts` (`normalizeWorkspaceSlug`).
- Lowercase, URL-safe, **globally unique** (including archived workspaces).
- **Immutable after creation** in MVP (no rename endpoint).
- **Never reused after archive (Option C):** archived rows keep their slug; new workspaces with the same base name get suffixes (`acme-2`, `acme-3`, …). Display name is not globally unique.

### Workspace archive (owner delete)

Owner-only: Settings → General → Delete workspace (`archiveWorkspace`).

1. Revoke all `PENDING` invitations.
2. Set `deletedAt` on `Workspace` (soft delete — estimates and audit data retained).
3. Reconcile owner active workspace; redirect to dashboard, onboarding, or invitations if none remain.
4. Members lose access immediately (all queries filter `deletedAt IS NULL`).

Hard purge of archived workspaces is deferred.

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

### User plan vs workspace billing link

| Concern | Source | Used for |
| --- | --- | --- |
| **Logged-in user's plan** | `BillingAccount` where `ownerUserId = currentUser.id` | Sidebar plan badge, navbar plan label, upgrade cards, invitee workspace caps (`maxAccessibleWorkspaces`), estimate quotas |
| **Workspace owner's plan (at create time)** | `Workspace.billingAccountId` → owner's `BillingAccount` | Invite seat limits for that workspace only (`maxInvitedSeats` via `assertCanInviteMember`) |

**UI rule:** Never show the active workspace's billing plan to members. Sidebar and account menus always reflect the **current user's** subscription (`getBillingSidebarState(userId)`).

Invited members with zero owned workspaces still see their personal plan (e.g. FREE) in the sidebar.

### Plan limits (MVP)

| Plan | Owned workspaces | Invited seats (per workspace) | Accessible workspaces (owned + member) |
| --- | --- | --- | --- |
| FREE | 1 | 0 | 1 |
| PRO | 1 | 3 | 3 |
| BUSINESS | unlimited | unlimited | unlimited |

Implementation: `src/server/permissions/entitlements.ts`

## Related entities

- `WorkspaceSettings` — branding JSON (`logoStorageKey`, `logoUrl`, estimate sections/rules), `aiInstructions`, `companyDescription`, company profile columns (`companyAddress`, `companyTaxId`, `companyEmail`, `companyPhone`) — see [`workspace-branding-and-company-profile.md`](../features/workspace-branding-and-company-profile.md)
- `WorkspaceInvitation` — email invites with `InviteRole`; status `PENDING | ACCEPTED | REVOKED | EXPIRED | DECLINED`; optional `promptDismissedAt` for modal dismissal
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

**Implemented today:**

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

EstimateSection {
  id
  workspaceId
  estimateId
  title
  sortOrder
  ...
}

EstimateLineItem {
  id
  workspaceId
  sectionId
  name
  unit
  quantity
  unitPrice
  vatRate
  sortOrder
  ...
}
```

**Planned extensions** (documented for implementation; not in schema yet):

```ts
Estimate {
  // additions
  title              String?
  status             EstimateStatus  // DRAFT | SENT | ...
  versionNumber      Int             // or separate EstimateVersion table
  parentEstimateId   String?         // version lineage
  requestId          String?         // denormalized link for queries
}

EstimateLineItem {
  marginPercent      Decimal?        // UI shows margin column
}

Workspace {
  // ...existing fields
  attachmentStorageUsedBytes  BigInt @default(0)
  attachmentStorageLimitBytes BigInt @default(262144000)  // 250 MB default
}

// Attachments — see docs/features/estimate-attachments.md
EstimateAttachment {
  estimateId
  workspaceId
  uploadedById
  attachmentType      // IMAGE | PDF
  originalFileName
  mimeType
  fileSizeBytes       // processed original + thumbnail
  storageKey
  storageProvider
  thumbnailStorageKey // images only
}

// Generated estimate PDFs — separate from user attachments; see docs/features/estimate-pdf-export.md
EstimatePdf {
  estimateId
  versionId           @unique   // one PDF per version
  fileKey             // UploadThing file key — null until READY
  storageCustomId     // UploadThing customId from upload
  status              // PENDING | GENERATING | READY | FAILED
  errorMessage
  generatedAt
  generatedLocale     // UI locale at generation (freshness)
  createdById
}

// Undo / agent approve — recommend EstimateRevision snapshots
EstimateRevision {
  estimateId
  versionNumber
  snapshotJson
  createdByUserId
  source            // MANUAL | AI_APPROVED
}

// Append-only AI assistant chat per estimate version (immutable; proposalJson preserved)
EstimateAiMessage {
  versionId
  role              // USER | ASSISTANT
  content
  proposalJson      // nullable snapshot of ProposeEditResult on ASSISTANT rows
}
```

Versioning recommendation: **`EstimateVersion`** table (or `versionNumber` + snapshot) rather than only soft-delete history — supports PDF per version and agent undo stack.

See [`estimate-ai.md`](estimate-ai.md) and [`docs/features/estimates.md`](../features/estimates.md).

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
