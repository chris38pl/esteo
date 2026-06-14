# Industry fields

Industry-specific attributes for business documents (estimate requests, estimates) are driven by a **catalog** of field definitions plus **typed value storage** on each document.

## Concepts

| Layer | Purpose |
|-------|---------|
| `IndustryFieldDefinition` | Admin-configured field schema per industry + document type |
| `IndustryFieldTranslation` | PL/EN labels, descriptions, placeholders |
| `DocumentFieldValue` | Stored values on a specific document instance |

Workspace `industry` (enum, immutable) determines which definition set applies.

## Typed value columns

Each `DocumentFieldValue` row stores **one** typed column based on the definition's `valueType`:

| valueType | Column |
|-----------|--------|
| TEXT, SELECT | `valueText` |
| NUMBER | `valueNumber` |
| DATE | `valueDate` |
| BOOLEAN | `valueBoolean` |

This enables SQL filters such as `area_size > 120` without string casts.

## Admin workflow

Route: `/dashboard/admin/industry-fields` (platform admin only).

- Filter by industry (Construction, Electrical, Carpentry, Plumbing) and document type tab (`ESTIMATE_REQUEST` active; `ESTIMATE` tab reserved).
- Create/edit definitions and PL/EN translations.
- Catalog only in MVP — user-submitted values are not browsed here.

## Server API (for future estimate form)

```ts
getIndustryFieldsForDocument({ workspaceId, documentType, locale })
// → ordered fields with labels and options

upsertDocumentFieldValues({ workspaceId, industry, documentType, documentId, values })
// → validates + writes typed columns
```

Module: `src/features/industry-fields/`

## Seed data

Construction + `ESTIMATE_REQUEST` fields are defined in `prisma/seed-industry-fields.ts` (repo catalog):

- `property_type` (SELECT)
- `area_size` (NUMBER)

| Command | Target DB | What it seeds |
| --- | --- | --- |
| `npm run prisma:seed` | `DATABASE_URL` (development) | Catalog + dev user/workspace/billing |
| `npm run prisma:seed:catalog` | `DATABASE_URL` (development) | Platform catalog only (industry fields) |
| `npm run prisma:seed:catalog:staging` | `DATABASE_URL_STAGING` | Same catalog on Neon **staging** |

Catalog seed is **idempotent** (upsert). It does **not** copy admin-defined fields created only on another branch — add those to `INDUSTRY_FIELD_CATALOG` in git or export via SQL.

Run `npm run prisma:seed` after reset for full dev workspace.

## AI prompt context

`getWorkspacePromptContext()` assembles workspace-specific AI instructions:

1. `WorkspaceSettings.companyDescription` — `## Company context` block (stored max 600 chars, prompt cap 500)
2. `WorkspaceSettings.aiInstructions` — `## Workspace rules` block (max 200 chars)
3. Estimate section templates — `## Estimate structure` + `## Section-specific rules` (defaults in `src/features/workspaces/config/industry-estimate-sections.ts`, overrides in `WorkspaceSettings.branding.estimateSections`)
4. Active `WorkspaceRule` rows (ESTIMATE type) — appended in sort order

Module: `src/features/workspaces/lib/prompt-context.ts`

## Related docs

- [`docs/architecture/database.md`](../architecture/database.md) — schema reference
- [`docs/features/estimate-requests.md`](estimate-requests.md) — future form consumer
