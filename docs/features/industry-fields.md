# Industry fields

Industry-specific attributes for business documents (estimate requests, estimates) are driven by a **catalog** of field definitions plus **typed value storage** on each document.

## Concepts

| Layer | Purpose |
|-------|---------|
| `IndustryFieldDefinition` | Admin-configured field schema per industry + document type |
| `IndustryFieldTranslation` | PL/EN labels, descriptions, placeholders |
| `DocumentFieldValue` | Stored values on a specific document instance |

Workspace `industry` (enum, immutable) determines which definition set applies.

**Product segments:** use `isServiceWorkspace(industry)` in `src/features/workspaces/lib/industries.ts` — today `WorkspaceIndustry.OTHER` maps to the **Services** segment (wedding planning, photography, marketing, etc.). A future enum rename to `SERVICES` is a one-line change in that helper. Do not branch on `industry === OTHER` in feature code.

Services workspaces use a free-text **Business Type** (`industryOtherText`, min 3 chars) instead of catalog fields like `property_type` / `area_size` on the public form.

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

- Filter by industry (Construction, Electrical, Carpentry, Plumbing) and document type tab (`ESTIMATE_REQUEST` active; `ESTIMATE` tab reserved). Services (`OTHER`) uses Business Type + company context instead of the construction field catalog on the public form.
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

1. `WorkspaceSettings.companyDescription` — `## Company Context` block (stored max 1500 chars, prompt cap 1200)
2. `WorkspaceSettings.aiInstructions` + active `WorkspaceRule` rows (ESTIMATE type) — `## Workspace Rules`
3. Estimate section templates — `## Estimate Structure` + section rules (defaults in `src/features/workspaces/config/industry-estimate-sections.ts`; Services uses Zakres / Usługi / Opcje dodatkowe / Uwagi)
4. Services only: `industryOtherText` (Business Type) — `## Business Type` block in estimate prompts (no dynamic `## Role`)

Segment logic: `isServiceWorkspace()` in `src/features/workspaces/lib/industries.ts`. Future enum rename `OTHER` → `SERVICES` is a one-line change.

Module: `src/features/workspaces/lib/prompt-context.ts`, `src/features/estimate-requests/config/industry-experience-config.ts`

**Future:** `industryOtherText` + `slugifyBusinessType()` + sections + rules form the foundation for a marketplace of industry templates (apply template = copy config into workspace; no enum migration required).

## Related docs

- [`docs/architecture/database.md`](../architecture/database.md) — schema reference
- [`docs/features/estimate-requests.md`](estimate-requests.md) — future form consumer
