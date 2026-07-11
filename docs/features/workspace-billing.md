# Workspace billing (Płatności)

> **Status:** Implemented (P0). Owner-only billing page per workspace, Stripe Checkout / Customer Portal, plan changes, usage overview, upcoming invoice preview, and **quantity-based add-ons** (storage + seats).

## Goal

Give workspace **owners** a single place to:

- See current plan, renewal/cancel date, and price
- Change plan (FREE → paid via Checkout; paid upgrades/downgrades in-app)
- Open Stripe Customer Portal (payment method, invoices, cancel/reactivate)
- Monitor usage (AI, estimates, seats, storage)
- Preview the next invoice amount and date (paid plans)
- Cancel or resume subscription at period end

Billing is **per workspace** (`BillingAccount` + `Subscription`), not per user. One owner can pay for multiple workspaces via shared `BillingCustomer` (customer-per-owner in v1).

---

## Routes & access

| Surface | Path | Access |
| --- | --- | --- |
| Billing overview | `/[locale]/dashboard/[workspaceSlug]/billing` | **OWNER** only |
| Plan selection (3 columns) | `/[locale]/dashboard/[workspaceSlug]/billing/plans` | **OWNER** only |
| Add-ons management | `/[locale]/dashboard/[workspaceSlug]/billing/addons` | **OWNER** only |
| Upgrade alias (redirect) | `/[locale]/dashboard/[workspaceSlug]/upgrade` → `/billing/plans` | **OWNER** only |
| Post-checkout sync | `/[locale]/dashboard/[workspaceSlug]/billing/checkout-success?session_id=…` | Authenticated owner |
| Post-portal sync | `/[locale]/dashboard/[workspaceSlug]/billing/portal-return` | Authenticated owner |
| Legacy redirect | `/[locale]/dashboard/billing` → canonical workspace billing URL | Owner |

**Split:** `/billing` = subscription overview (usage, invoices, cancel). `/billing/plans` = compare FREE/PRO/BUSINESS and start Checkout or in-app plan change. Sidebar and hero CTAs link to `/billing/plans` (or `/upgrade?plan=…`).

Non-owners hitting `/billing` or `/billing/plans` are redirected to the workspace dashboard.

Layout: `max-w-[1400px]` content column (`billing/page.tsx`, `billing/layout.tsx`).

---

## Page layout (top → bottom)

```txt
WorkspaceBillingPanel
├── Status banners (PAST_DUE, GRACE_PERIOD, storage/seat over limit, action errors)
├── BillingPlanHeroBanner          - plan hero + artwork + link to /billing/plans + manage payment
├── BillingUsageStatsSection       - 4-column usage grid (AI, estimates, users, storage)
├── BillingSecondaryCardsSection   - add-ons summary + next invoice (Stripe)
├── Member usage table             - per-user AI/estimate meters (if any usage)
└── BillingDangerZone              - cancel at period end / resume (paid plans only)
```

### Plan hero banner

- Plan-specific badge, gradient title, description, renewal/cancel row, monthly price (i18n placeholders for PRO/BUSINESS amounts)
- **Artwork:** owl strip on the right, mirrored into left gap on wide viewports (`HeroCardArtwork`, shared with estimates list pattern)
- Assets: `public/images/billing/hero-{plan}-{light|dark}.webp` - see [`public/images/billing/README.md`](../../public/images/billing/README.md)
- **Zmień plan** - primary `Button` (design-system `bg-primary`); opens dialog with upgrade targets
- **Zarządzaj płatnością** - opens Stripe Customer Portal (`openWorkspacePortalAction`)

Mobile: artwork offset right so owl stays visible; buttons full-width (stacked &lt;640px, side-by-side 640–768px); unified body scrim behind text + actions.

### Usage stats (4 cards)

| Card | Source |
| --- | --- |
| AI | `entitlements.usage.aiCallsThisMonth` / `limits.maxAiAssistantCallsPerMonth` |
| Estimates | `entitlements.usage.estimatesThisMonth` / `limits.maxEstimatesPerMonth` |
| Users | `(seats.used + seats.reserved + 1)` / `(seats.limit + 1)` - owner always counts as one user; `null` limit → unlimited |
| Storage | `storage.usedFormatted` / `storage.limitFormatted` |

**What increments `ESTIMATE_CREATED`**

| Action | Counts toward limit? |
| --- | --- |
| Dashboard create estimate (internal) | Yes - `recordUsageInTx` in create transaction |
| Public form (full pipeline, gate allowed) | Yes |
| Public form (request-only, gate blocked) | No |
| Manual convert queued request | Yes - at conversion time |

Usage is recorded atomically with estimate creation via `recordUsageInTx` (`usage-service.ts`).

On billing/entitlement reads, `reconcileEstimateUsageAggregate` heals drift when estimate rows exist in the period but metering was missed (e.g. submissions before metering shipped).

### Plan limits (catalog `*_2026`)

| Plan | Users (billing display) | Invites | Storage |
| --- | --- | --- | --- |
| FREE | 1 (owner) | - | 250 MB |
| PRO | 1 (owner) | - | 1 GB |
| BUSINESS | 5 (owner + 4 invites) | 4 | 5 GB |

Source: `src/server/billing/plan-catalog.ts`. Only **BUSINESS** may invite additional members (`maxInvitedSeats > 0`). Storage and seat caps are written to `Workspace` on plan/add-on sync via `syncWorkspaceEffectiveLimits`.

### Secondary cards

**Aktywne dodatki**

Summary of active storage and seat packs from entitlements. **Zarządzaj dodatkami** links to `/billing/addons`.

### Add-ons page (`/billing/addons`)

Quantity steppers for paid plans:

| Add-on | Unit | Price (PLN/mo per pack) | PRO | BUSINESS |
| --- | --- | --- | --- | --- |
| Storage | +10 GB | 39 | Yes | Yes |
| Seats | +5 users | 99 | No (upsell to Business) | Yes |

**Rules:**

- FREE cannot purchase add-ons (gated on page).
- Seat add-ons are **BUSINESS-only** at catalog, Stripe sync, entitlement merge, and server action layers.
- Reducing seat quantity is blocked when active members exceed the new cap.
- Plan downgrade BUSINESS → PRO schedules removal of seat add-on items at period end; storage add-ons are preserved.

Server: `changeWorkspaceAddonQuantity()` (`addon-change.ts`) updates Stripe subscription items with proration. Webhook/checkout sync calls `syncWorkspaceAddonsFromStripe()`.

**Env:** `STRIPE_PRICE_ADDON_STORAGE`, `STRIPE_PRICE_ADDON_SEATS` (see `.env.example`).

**Następna faktura (live)**

Server: `getWorkspaceUpcomingInvoice()` → Stripe `invoices.createPreview({ customer, subscription })`.

Parsed breakdown (`parse-invoice-preview-lines.ts`):

| Line bucket | Meaning |
| --- | --- |
| `recurringCents` | Next-period subscription lines (non-proration) |
| `prorationCents` | Signed net proration (positive charge, negative credit) |
| `amountCents` | `amount_due` |
| `referralBalanceAppliedCents` | Credit consumed from Stripe customer balance (`ending_balance − starting_balance` when starting credit) |

**Referral program balance (referrer rewards):** When the billing customer has Stripe credit from referral rewards, `amount_due` is already reduced. UI shows a breakdown line **„Saldo programu poleceń”** (billing overview + change preview dialog). Distinct from **„Zniżka polecająca (20%)”** - the coupon for users who were referred. Full spec: [referral-program.md](referral-program.md).

UI recurring display uses **catalog** (`WorkspaceBillingPricing.recurringCents` from DB `planVersion` + add-on quantities), not the billing page selection state.

| State | UI |
| --- | --- |
| Active paid sub | Total + breakdown (proration / referral coupon / **referral balance**) + „Kolejne faktury” |
| FREE plan | Empty + copy |
| `cancelAtPeriodEnd` | Empty + „no further invoice” copy |
| Stripe preview fails | Fallback: catalog recurring + DB `currentPeriodEnd` (no balance line - `referralBalanceAppliedCents: 0`) |

### Change preview (paid workspaces)

`previewWorkspaceBillingChangeAction` → Stripe `createPreview` with target items. UX by `prorationKind`:

| Kind | UX |
| --- | --- |
| `charge` | Full preview dialog (subscription + proration + optional referral balance line) |
| `credit` | Light credit confirm (proration credit only - referral balance not shown yet) |
| `none` | Apply immediately (e.g. scheduled downgrade) |

Preview TTL: 5 minutes (client UX only). Apply re-fetches workspace state; preview amounts are not trusted.

FREE → paid: Checkout only (no preview).

### Danger zone

Cancel at period end / resume subscription. Stripe footer lock line. Shown only when `plan !== FREE`.

---

## Data loading

**Server:** `getWorkspaceBillingPageData(workspaceId)` in [`get-workspace-billing-page-data.ts`](../../src/features/billing/server/get-workspace-billing-page-data.ts).

```typescript
WorkspaceBillingPageData = {
  entitlements,           // getWorkspaceEntitlements()
  pricing,                // WorkspaceBillingPricing - catalog recurring + Stripe preview fields
  cancelAtPeriodEnd,
  currentPeriodEnd,
  memberUsage,            // per-user AI + estimate meters
  storage,                // formatted bytes + percent
  storageOverLimit,
  seatOverLimit,
  nextInvoice,            // Stripe preview breakdown or empty reason
}
```

`billing_pricing_computed` structured log (server only): `workspaceId`, `workspaceSlug`, `stripeSubscriptionId`, `plan`, `planVersion`, `recurringCents`, `nextInvoiceCents`.

**Client:** `WorkspaceBillingPanel` calls server actions for mutations; successful portal/checkout redirects via `window.location`.

---

## Server actions (owner-only)

| Action | Stripe / DB effect |
| --- | --- |
| `changeWorkspaceAddonQuantityAction(workspaceId, addonKey, quantity)` | → `changeWorkspaceAddonQuantity()` - Stripe subscription item qty |
| `previewWorkspaceBillingChangeAction(workspaceId, change)` | → `previewWorkspaceBillingChange()` - Stripe preview for UX |
| `changeWorkspacePlanAction(workspaceId, plan)` | → `changeWorkspaceSubscriptionPlan()` - Checkout or in-app update |
| `openWorkspacePortalAction(workspaceId)` | Stripe Billing Portal session; `return_url` → portal-return |
| `cancelWorkspaceSubscriptionAction(workspaceId)` | `cancel_at_period_end` + sync |
| `reactivateWorkspaceSubscriptionAction(workspaceId)` | Clear cancel flags + sync |

All actions: `syncUserFromClerk` → `requireRole(..., "OWNER")`.

---

## Stripe integration (summary)

Full diagrams, plan-change matrix, portal sync, and duplicate-sub cleanup: [`docs/architecture/billing-stripe.md`](../architecture/billing-stripe.md).

**Key rules:**

- Single entrypoint for plan changes: `changeWorkspaceSubscriptionPlan()` (`plan-change.ts`)
- Webhook + checkout-success + portal-return all funnel into `syncSubscriptionFromStripe` / `syncWorkspaceSubscriptionFromStripe`
- Portal cancel sets `cancel_at` or `cancel_at_period_end` → DB `cancelAtPeriodEnd: true`, plan unchanged until period end
- Localhost without `stripe listen`: run `npm run dev:sync-workspace-billing` or rely on portal-return route

**Env (see `.env.example`):**

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS` (and optional webhook price mapping)
- `STRIPE_PRICE_ADDON_STORAGE`, `STRIPE_PRICE_ADDON_SEATS`

---

## Sidebar & navigation

- Plan card / upgrade CTA: `get-billing-sidebar-state.ts` + `sidebar-plan-card.tsx`, `sidebar-upgrade.tsx`
- Billing link in user menu → workspace-scoped `/billing`
- Legacy `/dashboard/billing` resolved via `resolve-legacy-billing-url.ts`

---

## Admin & dev tooling

**Admin workspace report** includes billing fields (`currentPeriodEnd` when canceling) - `workspace-billing-report-panel.tsx`, `server/billing/dev-toolkit/report.ts`.

**Dev CLI** (non-production only): [`scripts/dev-billing/README.md`](../../scripts/dev-billing/README.md)

| Command | Use |
| --- | --- |
| `dev:list-workspaces` | Find slugs, plan, renewal/cancel state |
| `dev:workspace-state` | Full entitlement + Stripe dump |
| `dev:set-workspace-plan` | Fast DB plan change (no Stripe) |
| `dev:sync-workspace-billing` | Pull subscription from Stripe after portal |
| `dev:billing-reset` | Destructive: cancel all Stripe subs + FREE |

Polish quick-reference table: [`docs/dev/billing-toolkit.md`](../dev/billing-toolkit.md).

---

## i18n

Namespaces: `billing.workspace.*` in `src/messages/{pl,en}/billing.json`

Sections: `planHero`, `plans`, `usage`, `addons`, `addonPage`, `nextInvoice`, `dangerZone`, `statusNotice`, `memberUsage`, `actions`.

Hero prices (`planHero.price.*`) are **display placeholders** - authoritative amounts come from Stripe on the next-invoice card.

---

## File map

| Area | Path |
| --- | --- |
| Billing overview page | `src/app/.../billing/page.tsx` |
| Plans page | `src/app/.../billing/plans/page.tsx` |
| Add-ons page | `src/app/.../billing/addons/page.tsx` |
| Upgrade alias | `src/app/.../upgrade/page.tsx` |
| Overview panel | `src/features/billing/components/workspace-billing-panel.tsx` |
| Plans panel | `src/features/billing/components/workspace-plans-panel.tsx` |
| Add-ons panel | `src/features/billing/components/workspace-addons-panel.tsx` |
| Hero | `billing-plan-hero-banner.tsx`, `billing-plan-hero-styles.tsx`, `lib/billing-plan-hero-images.ts` |
| Plan limits labels | `lib/format-plan-limit-labels.ts` |
| Usage grid | `billing-usage-stats-section.tsx` |
| Secondary cards | `billing-secondary-cards-section.tsx` |
| Shared artwork | `src/components/hero-card/hero-card-artwork.tsx` |
| Page data | `billing-page-data.ts`, `get-workspace-billing-page-data.ts`, `billing-plans-page-data.ts`, `get-workspace-billing-plans-page-data.ts`, `billing-addons-page-data.ts`, `get-workspace-billing-addons-page-data.ts` |
| Route helpers | `src/lib/dashboard-routes.ts` |
| Upcoming invoice | `get-workspace-upcoming-invoice.ts` |
| Stripe core | `billing-service.ts`, `plan-change.ts`, `addon-change.ts`, `subscription-sync.ts`, `workspace-addon-sync.ts`, `billing-actions.ts` |
| Routes | `checkout-success/route.ts`, `portal-return/route.ts` |

---

## Manual test checklist

- [ ] Owner opens `/billing`; member redirected
- [ ] `/billing/plans` shows 3 columns with catalog limits; current plan highlighted
- [ ] `/upgrade` redirects to `/billing/plans`; `?plan=PRO` highlights card
- [ ] FREE → upgrade opens Stripe Checkout; return syncs plan; cancel returns to plans page
- [ ] PRO → BUSINESS updates without Checkout
- [ ] BUSINESS → PRO schedules downgrade at period end
- [ ] Portal cancel → return URL syncs `cancelAtPeriodEnd`; hero badge “Anuluje się”
- [ ] Resume subscription clears cancel flag
- [ ] Usage cards reflect entitlements + storage
- [ ] Next invoice shows Stripe amount/date (active paid sub)
- [ ] Next invoice breakdown shows referral balance line when referrer has Stripe credit
- [ ] Change preview (add-ons) shows proration + referral balance + addons note
- [ ] `/billing/addons`: PRO can add storage only; BUSINESS can add storage + seats; FREE gated
- [ ] Seat quantity decrease blocked when over member cap
- [ ] Canceling sub shows empty next-invoice state with correct copy
- [ ] Hero owl visible on desktop (mirror) and mobile (right offset)
- [ ] `npm run test:workspace-billing` passes

---

## Not in scope (yet)

- Per-seat or storage metered billing in Stripe (add-ons use fixed recurring prices per pack qty)
- Invoice PDF list in-app (use Customer Portal)
- Billing for non-owner roles
