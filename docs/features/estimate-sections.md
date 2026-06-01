# Estimate sections (industry templates)

Esteo organizes generated estimates into **ordered sections** (work phases). This feature provides:

- **Default section templates per industry** (Construction, Electrical, Carpentry, Plumbing, Other)
- **Workspace overrides** so each workspace can tailor sections to its workflow
- **Prompt injection** so AI generation follows the configured structure consistently

## Where defaults live

Default templates are hardcoded in:

- `src/features/workspaces/config/industry-estimate-sections.ts`

Each section definition includes:

- a stable `key`
- PL/EN titles
- a short default section rule (used as AI guidance)

## Workspace overrides (settings UI)

Route:

- `/[locale]/dashboard/workspaces/settings?tab=rules`

Under the **Rules** tab (below “Rules for: Creating cost estimates”), the user can manage **Estimate sections**:

- **Reorder** sections via drag & drop
- **Rename** a section (edited in the current UI locale; the other locale keeps its previous value)
- **Toggle active** (inactive sections are omitted from prompts)
- **Add / delete** custom sections
- **Reset to defaults** (clears workspace override and reverts to industry template)

Persistence:

- Overrides are stored in `WorkspaceSettings.branding.estimateSections`

## How it affects AI prompts

`getWorkspacePromptContext()` assembles workspace-specific prompt context and injects two blocks derived from the active section list:

- `## Estimate structure` — the ordered list of section titles (omit irrelevant sections)
- `## Section-specific rules` — per-section rule bodies when present

This sits alongside:

- `## Company context` (`WorkspaceSettings.companyDescription`)
- `## Workspace rules` (`WorkspaceSettings.aiInstructions`)
- global estimate rules (workspace estimate rules + system defaults)

## Admin transparency (read-only)

Platform admins can preview the shipped templates here:

- `/[locale]/dashboard/admin/industry-fields`

The panel is read-only and exists to make the shipped defaults transparent.

