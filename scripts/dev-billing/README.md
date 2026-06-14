# Dev Billing Toolkit (CLI)

Development-only workspace billing commands. **Never available when `VERCEL_ENV=production`.**

Requires `.env` with `DATABASE_URL` (and `STRIPE_SECRET_KEY` for `dev:billing-reset` when canceling Stripe subs).

## Command responsibilities

| Goal | Command |
|------|---------|
| Find workspace slugs | `dev:list-workspaces` (plan, status, seats, renewal / cancel-at-period-end) |
| Diagnose entitlements | `dev:workspace-state` |
| Fast plan change (no Stripe) | `dev:set-workspace-plan` |
| Lifecycle / banners / gating | `dev:set-workspace-status` or `dev:simulate-webhook` |
| Reset usage meters | `dev:clear-usage` |
| Full cleanup + Stripe cancel | `dev:billing-reset` |
| Pull subscription state from Stripe | `dev:sync-workspace-billing` |

### `dev:set-workspace-plan` vs `dev:billing-reset`

**PRO → FREE for UI testing** — use set-plan (fast, safe, no Stripe):

```bash
npm run dev:set-workspace-plan -- --slug firma-juniora --plan FREE
```

**Return to clean FREE + cancel all Stripe subs for workspace** — use billing-reset (destructive):

```bash
npm run dev:billing-reset -- --slug firma-juniora
```

Cancels every active-like Stripe subscription with matching `metadata.workspaceId`, not only the id stored in DB.

## Commands

```bash
npm run dev:list-workspaces
npm run dev:list-workspaces -- --owner user@example.com

npm run dev:workspace-state -- --slug firma-juniora

npm run dev:set-workspace-plan -- --slug firma-juniora --plan PRO
npm run dev:set-workspace-status -- --slug firma-juniora --status GRACE_PERIOD
npm run dev:clear-usage -- --slug firma-juniora
npm run dev:billing-reset -- --slug firma-juniora
npm run dev:sync-workspace-billing -- --slug firma-juniora

npm run dev:simulate-webhook -- --slug firma-juniora --event customer.subscription.deleted
npm run dev:simulate-webhook -- --slug firma-juniora --event invoice.payment_failed
```

`invoice.payment_failed` dev simulation applies `past_due` via the same handler path as `customer.subscription.updated`.

## Optional UI

Set `ENABLE_DEV_BILLING_TOOLS=true` in `.env` for a future `/dev/billing` page (not shipped in v1).

## Daily workflow

```bash
npm run dev:list-workspaces
npm run dev:workspace-state -- --slug <slug>
# mutate...
npm run dev:workspace-state -- --slug <slug>
```
