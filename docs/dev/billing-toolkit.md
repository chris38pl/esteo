# Dev billing toolkit (quick reference)

Full docs: [`scripts/dev-billing/README.md`](../../scripts/dev-billing/README.md) · Feature overview: [`docs/features/workspace-billing.md`](../features/workspace-billing.md)

**Blocked when `VERCEL_ENV=production`.**

| Command | Purpose | Example |
| --- | --- | --- |
| `dev:list-workspaces` | List test workspaces (plan, status, seats, billing) | `npm run dev:list-workspaces -- --owner user@example.com` |
| `dev:workspace-state` | Full billing report (entitlements, usage, Stripe IDs) | `npm run dev:workspace-state -- --slug firma-juniora` |
| `dev:set-workspace-plan` | Instant DB plan change (no Stripe) | `npm run dev:set-workspace-plan -- --slug X --plan PRO` |
| `dev:set-workspace-status` | Lifecycle status (GRACE_PERIOD, EXPIRED, …) | `npm run dev:set-workspace-status -- --slug X --status GRACE_PERIOD` |
| `dev:clear-usage` | Reset AI/estimate usage meters | `npm run dev:clear-usage -- --slug X` |
| `dev:sync-workspace-billing` | Pull subscription from Stripe (portal / no webhook) | `npm run dev:sync-workspace-billing -- --slug X` |
| `dev:billing-reset` | Cancel all Stripe subs for workspace + FREE in DB | `npm run dev:billing-reset -- --slug X` |
| `dev:simulate-webhook` | Run production webhook handler locally | `npm run dev:simulate-webhook -- --slug X --event customer.subscription.deleted` |

## set-plan vs billing-reset

| Scenario | Command | Stripe |
| --- | --- | --- |
| PRO → FREE (UI test) | `dev:set-workspace-plan --plan FREE` | Unchanged |
| After checkout cleanup | `dev:billing-reset` | Cancels subs |

## Typical workflow

1. `dev:list-workspaces`
2. `dev:workspace-state -- --slug <slug>` (baseline)
3. Mutate (set-plan, portal, checkout, sync)
4. `dev:workspace-state` (verify)
5. `dev:billing-reset` (end of session, optional)
