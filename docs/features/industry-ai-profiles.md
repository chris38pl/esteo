# Industry AI profiles

Estimate draft generation and the estimate AI assistant inject **industry-specific** guidance from a central registry - not separate prompt files per industry.

## Registry

[`src/ai/config/industry-ai-profiles.ts`](../../src/ai/config/industry-ai-profiles.ts)

One profile per `WorkspaceIndustry`: `CONSTRUCTION`, `ELECTRICAL`, `CARPENTRY`, `PLUMBING`, `OTHER`.

Each profile defines (localized `pl` / `en`):

| Field | Purpose |
| --- | --- |
| `role` | Estimator persona for that trade |
| `estimationPrinciples` | Units, pricing, VAT, materials vs labor |
| `scopeChecklist` | What to analyze in the project brief |
| `scopeExpansionRules` | Infer implied work (e.g. bathroom tiles → waterproofing, grout) |
| `quantityDerivationRules` | Optional - how to derive quantities from brief data; omitted from draft prompts when absent |

Resolver: `resolveIndustryAiProfileForPrompt(industry, locale)`.

Formatters: [`src/ai/lib/format-industry-profile-blocks.ts`](../../src/ai/lib/format-industry-profile-blocks.ts).

## Draft prompt order

[`buildEstimateDraftPrompt`](../../src/ai/prompts/estimate-draft.ts) assembles a **single** template:

1. Role  
2. Estimation Principles  
3. Company Context  
4. Workspace Rules  
5. Estimate Structure  
6. Section-Specific Rules  
7. System + user estimate rules  
8. Project Brief (`buildProjectBrief`)  
9. Scope Checklist  
10. Scope Expansion Rules  
11. Quantity Derivation Rules (only when configured for the industry)  
12. Estimate Completeness  
13. Output Rules  

Workspace context is loaded via [`loadEstimateGenerationContext`](../../src/features/workspaces/lib/load-estimate-generation-context.ts) (branding sections, not `WorkspaceRule` rows).

## Section titles after generation

- Schema: `section.title` is `z.string()` (user-configurable sections may drift).
- Post-AI: `validateGeneratedSectionTitles()` records warnings in `aiMetadata`; generation is not failed for minor title mismatch.
- Hard fail only when the model returns no sections or no line items.

## Related docs

- [Estimate sections](estimate-sections.md) - section templates in branding  
- [Estimate AI architecture](../architecture/estimate-ai.md)
