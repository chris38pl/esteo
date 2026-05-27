// docs\architecture\database.md

# Core Entities

## User

```ts
User {
  id
  email
  clerkId
  createdAt
  updatedAt
}
```

## Workspace

```ts
Workspace {
  id
  ownerId
  slug
  branding
  plan
  defaultLocale
  deletedAt
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
}
```

## Estimate

```ts
Estimate {
  id
  workspaceId
  estimateRequestId
  sections
  totals
  aiMetadata
  version
  createdAt
  updatedAt
}
```

## EstimateItem

```ts
EstimateItem {
  id
  estimateId
  sectionId
  name
  material
  unit
  quantity
  unitPrice
  netValue
  margin
  vat
  grossValue
}
```

---

# Database Setup
- PostgreSQL + Prisma


# Database Standards

Every business entity MUST contain:
- workspaceId
- createdAt
- updatedAt

## Must Have

### Soft Deletes
```ts
deletedAt DateTime?
```

### Audit Logs
Track:
- changes,
- actor,
- timestamps.

### Versioning
Support estimate snapshots.

### IDs
Recommendation:
- CUID2

### Timestamps
Every entity:
- createdAt
- updatedAt