# Other industry evolution playbook

OTHER is a **fallback and incubator**, not the permanent home for groomers, photographers, copywriters, and similar service businesses.

## OTHER v2 (current)

- `hasIndustrySectionDefaults = false` - no Zakres / Usługi / Uwagi template
- `sectionStructureMode: ai_dynamic` when workspace has no section override
- AI output: **Commercial Sections** only (no narrative sections in the estimate table)
- Client brief remains a separate block

## Analytics

Each OTHER estimate generation emits `[other-estimate-generation]` with:

- `industryOtherText` + `industryOtherTextSlug` (`slugifyBusinessType`)
- `sectionStructureMode`
- `generatedSectionTitles`

Use these aggregates to decide when to promote a cluster to a dedicated profile.

## Promotion criteria (guideline)

When an `industryOtherText` cluster reaches roughly **25–50 workspaces** and shows:

- Stable section title patterns in analytics
- Acceptable eval scores for representative scenarios
- Clear business type distinct from long-tail noise

Then:

1. Add industry profile `GROOMER_V1` / `PHOTOGRAPHER_V1` / etc. in `industry-ai-profiles.ts`
2. Optionally add `hasIndustrySectionDefaults = true` with phase sections
3. Suggest migration for existing OTHER workspaces with matching `industryOtherText`
4. Keep OTHER for long tail

## Migration from legacy OTHER template

Workspaces that saved the old four-section template (Zakres, Usługi, Opcje, Uwagi) are cleared by:

```bash
npx tsx scripts/migrate-other-v2-sections.ts
```

Custom workspace section overrides are preserved.

Historical estimate versions are **not** rewritten.
