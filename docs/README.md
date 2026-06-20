# Esteo documentation

Product and technical docs for implementation planning. Root overview: [`ARCHITECTURE.md`](../ARCHITECTURE.md). Product snapshot: [`.conception/small-prd.md`](../.conception/small-prd.md).

## Features

| Document | Description |
| --- | --- |
| [estimate-requests.md](features/estimate-requests.md) | Public and internal estimate request intake |
| [voice-intake.md](features/voice-intake.md) | AI voice assistant — record, extract, fill estimate form |
| [voice-intake-decisions.md](features/voice-intake-decisions.md) | Voice intake UX/tech decisions and solved problems |
| [estimates.md](features/estimates.md) | Estimates (kosztorysy) — flows, versions, entitlements |
| [estimates-view-edit-ui.md](features/estimates-view-edit-ui.md) | Estimate view/edit screen UI spec |
| [estimate-autosave.md](features/estimate-autosave.md) | Estimate editor autosave — section/item persistence, sync guard, conflict queue |
| [estimate-sections.md](features/estimate-sections.md) | Section templates and workspace overrides |
| [estimate-pdf-export.md](features/estimate-pdf-export.md) | PDF export, preview, and Dokumenty tab |
| [estimate-send-workflow.md](features/estimate-send-workflow.md) | Send to client (email + PDF), transport polling, SENT/ACCEPTED/REJECTED workflow |
| [estimate-activity-history.md](features/estimate-activity-history.md) | Estimate editor History tab — user-facing activity log |
| [estimate-summary.md](features/estimate-summary.md) | Estimate editor Summary tab — versions, workflow, scope, payments snapshot, brief, recommendations |
| [estimate-notes.md](features/estimate-notes.md) | Internal threaded notes on estimates |
| [estimate-payments.md](features/estimate-payments.md) | Payment schedule (installment tracker) |
| [industry-fields.md](features/industry-fields.md) | Dynamic industry fields on documents |
| [workspace-onboarding.md](features/workspace-onboarding.md) | Workspace creation and onboarding |
| [workspace-billing.md](features/workspace-billing.md) | Workspace billing page — plans, Stripe, usage, invoices |
| [referral-program.md](features/referral-program.md) | Partner program — rewards, KPI v6, billing balance disclosure |
| [activation-flow.md](features/activation-flow.md) | Owner activation checklist on `/estimates` (Phase 1) |
| [workspace-branding-and-company-profile.md](features/workspace-branding-and-company-profile.md) | Company logo (UploadThing) and company profile tab for PDF/client docs |
| [admin-workspaces.md](features/admin-workspaces.md) | Platform admin workspace tools |
| [issue-tracker.md](features/issue-tracker.md) | Internal issue tracker — staging bug capture, admin triage, Cursor sync |
| [authentication.md](features/authentication.md) | Custom Clerk Elements sign-in, Client Trust, email second-factor |
| [global-search.md](features/global-search.md) | Workspace command palette (Ctrl+K), SearchDocument index, recents |
| [ai-eval-harness.md](features/ai-eval-harness.md) | AI quality evals for Services estimate drafts — Fast/Full, baseline, compare |

## Architecture

| Document | Description |
| --- | --- |
| [backend.md](architecture/backend.md) | Feature folders, server pattern, jobs |
| [deployment.md](architecture/deployment.md) | Domain architecture (`esteo.app`, `preview.esteo.app`), Vercel env mapping, Trigger.dev |
| [database.md](architecture/database.md) | Schema, billing, planned estimate models |
| [billing-stripe.md](architecture/billing-stripe.md) | Stripe subscriptions, plan changes, portal sync, webhooks |
| [ai.md](architecture/ai.md) | Global AI stack and prompt layers |
| [estimate-ai.md](architecture/estimate-ai.md) | Estimate draft job and agentic edit |
| [voice-intake.md](architecture/voice-intake.md) | Voice intake — API, state machine, AI pipeline |
| [ai-eval-harness.md](architecture/ai-eval-harness.md) | Eval engine, scorers, fixtures, baseline/compare |

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

## Dev tooling

| Document | Description |
| --- | --- |
| [dev/billing-toolkit.md](dev/billing-toolkit.md) | CLI commands for local billing tests |
| [features/issue-tracker.md](features/issue-tracker.md) | Issue tracker — full feature reference |
| [../scripts.md](../scripts.md#issue-tracker--sync-do-cursor) | `sync:issues` CLI commands |
| [../scripts.md](../scripts.md#ai-eval-harness--services-jakość-wycen-ai) | `eval:services*` — AI quality evals for Services drafts |

## Estimate feature map

```txt
estimate-requests.md  →  voice-intake.md (optional voice fill)
        ↓
estimate-requests.md  →  estimate-ai.md (job)  →  estimates.md
                              ↓
                    estimates-view-edit-ui.md
                         ↓              ↓
              estimate-activity-history.md   estimate-notes.md
                         ↓              ↓
                 estimate-summary.md    estimate-payments.md
                         ↓
                 estimate-autosave.md
                              ↓
                    estimate-pdf-export.md
                              ↓
                    estimate-send-workflow.md
```

Supporting: `estimate-sections.md`, `industry-fields.md`, `database.md`.
