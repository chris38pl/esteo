# Esteo documentation

Product and technical docs for implementation planning. Root overview: [`ARCHITECTURE.md`](../ARCHITECTURE.md). Product snapshot: [`.conception/small-prd.md`](../.conception/small-prd.md).

## Features

| Document | Description |
| --- | --- |
| [estimate-requests.md](features/estimate-requests.md) | Public and internal estimate request intake |
| [estimates.md](features/estimates.md) | Estimates (kosztorysy) — flows, versions, entitlements |
| [estimates-view-edit-ui.md](features/estimates-view-edit-ui.md) | Estimate view/edit screen UI spec |
| [estimate-sections.md](features/estimate-sections.md) | Section templates and workspace overrides |
| [estimate-pdf-export.md](features/estimate-pdf-export.md) | PDF export (stub) |
| [industry-fields.md](features/industry-fields.md) | Dynamic industry fields on documents |
| [workspace-onboarding.md](features/workspace-onboarding.md) | Workspace creation and onboarding |
| [admin-workspaces.md](features/admin-workspaces.md) | Platform admin workspace tools |
| [authentication.md](features/authentication.md) | Custom Clerk Elements sign-in, Client Trust, email second-factor |

## Architecture

| Document | Description |
| --- | --- |
| [backend.md](architecture/backend.md) | Feature folders, server pattern, jobs |
| [database.md](architecture/database.md) | Schema, billing, planned estimate models |
| [ai.md](architecture/ai.md) | Global AI stack and prompt layers |
| [estimate-ai.md](architecture/estimate-ai.md) | Estimate draft job and agentic edit |

## Standards

| Document | Description |
| --- | --- |
| [coding.md](standards/coding.md) | Code conventions |
| [naming.md](standards/naming.md) | Naming conventions |
| [ui.md](standards/ui.md) | UI patterns |
| [design-tokens.md](standards/design-tokens.md) | Design tokens |

## ADR & incidents

| Document | Description |
| --- | --- |
| [adr/001-workspace-deletion-and-slug-policy.md](adr/001-workspace-deletion-and-slug-policy.md) | Workspace archive and slug policy |
| [incidents/README.md](incidents/README.md) | Incident index |

## Estimate feature map

```txt
estimate-requests.md  →  estimate-ai.md (job)  →  estimates.md
                              ↓
                    estimates-view-edit-ui.md
                              ↓
                    estimate-pdf-export.md (later)
```

Supporting: `estimate-sections.md`, `industry-fields.md`, `database.md`.
