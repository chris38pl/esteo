# Estimate sections (industry templates)

Esteo organizes generated estimates into **ordered sections** (work phases). This feature provides:

- **Default section templates per dedicated industry** (Construction, Electrical, Carpentry, Plumbing)
- **Dynamic structure for Other (services)** - no industry defaults; AI proposes **Commercial Sections**
- **Workspace overrides** so each workspace can tailor sections to its workflow
- **Prompt injection** so AI generation follows the configured structure consistently

## Commercial Section (Sekcja handlowa)

A **Commercial Section** contains commercial line items that contribute to the estimate value. Items may have `unitPrice` of 0 or negative when commercially meaningful (included transport, promotional discount).

**Do not** use Commercial Sections for narrative content (scope summaries, terms, exclusions). The client brief lives outside the estimate table.

**Narrative section titles to avoid:** Zakres, Uwagi, Opis, Oferta, Kosztorys, generic Usługi.

## Other industry (OTHER v2)

`WorkspaceIndustry.OTHER` has `hasIndustrySectionDefaults = false`. With no workspace override, `sectionStructureMode` is `ai_dynamic` and AI proposes section titles per business type and brief.

See [other-industry-evolution.md](./other-industry-evolution.md) for the product playbook (incubator → dedicated `*_V1` profiles).

## Where defaults live

Default templates for dedicated industries:

- [`src/features/workspaces/config/industry-estimate-sections.ts`](../src/features/workspaces/config/industry-estimate-sections.ts)

Legacy OTHER defaults (pre-v2) are frozen in:

- [`src/features/workspaces/lib/migrate-legacy-other-sections.ts`](../src/features/workspaces/lib/migrate-legacy-other-sections.ts)

## Workspace overrides (settings UI)

Route:

- `/[locale]/dashboard/workspaces/settings?tab=rules`

Under the **Rules** tab, users can manage **Estimate sections**:

- **Other (no defaults):** empty state - AI proposes structure; user may add sections for a fixed override
- **Dedicated industries:** industry template sections by default
- Reorder, rename, toggle active, add/delete, reset to defaults

Persistence: `WorkspaceSettings.branding.estimateSections`

Migration for workspaces with saved legacy OTHER template:

```bash
npx tsx scripts/migrate-other-v2-sections.ts --dry-run
npx tsx scripts/migrate-other-v2-sections.ts
```

## How it affects AI prompts

`getWorkspacePromptContext()` / `buildEstimateDraftPrompt()` use `sectionStructureMode`:

| Mode | Prompt |
|------|--------|
| `ai_dynamic` | Dynamic structure + Commercial Section naming rules |
| `industry_defaults` | `## Estimate Structure` from industry template |
| `workspace_override` | `## Estimate Structure` from saved workspace sections |

## Admin transparency

- `/[locale]/dashboard/admin/industry-fields` - section templates (Other shows “no defaults”)

## Estimates feature

Section templates feed draft generation and the estimate agent. Industry-specific profiles apply to construction trades; services use `SERVICE_ESTIMATION_PRINCIPLES` and Commercial Section rules.
