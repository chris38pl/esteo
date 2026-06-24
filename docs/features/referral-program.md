# Program partnerski (referrals)

> **Status:** Implemented (v6). Partner dashboard at `/referrals`, Stripe customer balance rewards for referrers, 20% coupon for referred workspaces, billing UI disclosure of applied referral balance.

## Goal

Workspace **owners** who refer other companies earn **PLN credits** (Stripe customer balance) when the referred workspace activates a paid PRO or BUSINESS subscription. Referred users get a **20% discount for 3 months** on checkout.

---

## Routes & access

| Surface | Path | Access |
| --- | --- | --- |
| Partner program | `/[locale]/dashboard/[workspaceSlug]/referrals` | Workspace **owner** (any plan: FREE, PRO, BUSINESS) |
| Claim referral (sign-up) | `/sign-up?ref=…` | Public |
| Billing (balance applied) | `/[locale]/dashboard/[workspaceSlug]/billing` | Owner |

**Who can refer (MVP):** every workspace owner — no paid-plan gate. Link and profile are per **referrer user**, not per workspace.

---

## Reward ownership (per user, not per workspace)

Nagroda referral jest przypisana do **użytkownika** (`referrerUserId`), nie do konkretnego workspace.

Example: Jan owns workspace A, B, and C — the bonus lands on Jan's Stripe **BillingCustomer** balance (account level). There is no “bonus in workspace B”.

### V1 assumption: customer-per-owner

- **One owner = one `BillingCustomer`** (shared across all owned workspaces).
- Referral balance can be applied to invoices for any workspace that uses that owner's BillingCustomer.
- **Where does the bonus go?** To the **owner's account**, not a specific workspace.

Future (V2+): corporate vs personal workspaces may need an explicit decision if billing moves to customer-per-workspace. On MVP the answer is always: **owner account**.

---

## Stripe customer for referrers

`ensureReferrerStripeCustomerId()` creates a Stripe customer + `BillingCustomer` lazily when a FREE referrer earns their first bonus (no prior checkout).

Race-safe: `BillingCustomer.ownerUserId` is unique. Concurrent activations use create + `isUniqueConstraintError` retry (orphan Stripe customer cleaned up best-effort).

**Deploy step 0** before unique migration:

```sql
SELECT "ownerUserId", COUNT(*)
FROM "BillingCustomer"
GROUP BY "ownerUserId"
HAVING COUNT(*) > 1;
```

→ 0 rows on staging and production, otherwise dedupe before `prisma migrate deploy`.

---

## Analytics events (client)

CustomEvent `esteo:referral-analytics`:

| Event | When |
| --- | --- |
| `referral_link_copied` | Copy link, code, or email on partner page |
| `referral_share_clicked` | Invite share button (native share or mailto) |

Example funnel after a month: 1000 owners → 120 copied link → 17 activations.

---

## Reward amounts

| Referred plan | Referrer bonus |
| --- | --- |
| PRO | 30 PLN |
| BUSINESS | 80 PLN |

Bonus is granted once per referral when the referred workspace's subscription becomes **ACTIVE** (first paid activation). Stored in `Referral.rewardCents`; credited to Stripe as negative customer balance (credit).

---

## Referred user discount

- **20% off** subscription for **3 months** (`STRIPE_REFERRAL_COUPON_ID`)
- Applied at Stripe Checkout when referral is `PENDING_CLAIM` and coupon env is set
- UI on billing manage may show promotional prices even without coupon — Stripe charges full price if env missing (dev log: `[referral] … STRIPE_REFERRAL_COUPON_ID missing`)

Create coupon:

```bash
stripe coupons create --percent-off=20 --duration=repeating --duration-in-months=3 --name="Referral 20% 3 months"
```

---

## Referral lifecycle

```txt
Sign-up with ref link
  → Referral PENDING_CLAIM
  → Workspace created + claim window (30 days / before first payment)
  → Referred user pays PRO/BUSINESS
  → Referral ACTIVE + reward grant flow
       → rewardStatus PENDING → GRANTED (Stripe balance txn) or FAILED
```

### `ReferralRewardStatus` (v6)

| Status | Meaning |
| --- | --- |
| `PENDING` | Active referral eligible for reward; Stripe credit not yet confirmed |
| `GRANTED` | `ReferralCreditLedger.stripeBalanceTxnId` set; balance on referrer customer |
| `FAILED` | Grant attempt failed; `rewardFailureReason` + `rewardLastRetryAt` for retry |

Migration: `20260619180000_referral_reward_status`.

**Important:** KPI „Przyznane nagrody” counts only `GRANTED` rows. Previously, rows could show as granted in UI without a Stripe balance transaction — v6 fixes this and provides backfill scripts.

---

## Partner dashboard KPIs (hero cards)

| KPI | Source |
| --- | --- |
| Przyznane nagrody | Sum of `rewardCents` where `rewardStatus = GRANTED` |
| W trakcie | Sum where `rewardStatus IN (PENDING, FAILED)` |
| Dostępne saldo | Live Stripe customer balance (abs of negative `customer.balance`) |
| **Wykorzystane saldo** | `max(0, granted − available)` — consumed on paid invoices |
| Polecone firmy | Count of referrals with `status = ACTIVE` |

Invariant: `usedBalanceCents = grantedRewardsCents − availableBalanceCents` (when Stripe is source of truth for available).

---

## Invitations table

Columns: email, status, joined date, bonus amount. **PRO/BUSINESS badge** next to email shows the referred workspace plan at activation.

---

## Share UX

- Primary: copy referral link (`/sign-up?ref=…`)
- Fallback copy: invite by company settings within 30-day claim window (before first payment)
- Gift hero banner: `public/images/referrals/hero-gift-{light|dark}.webp` with blue mist glow (mobile: right artwork + text scrim)

### Referred user — settings card

After claiming a referrer (code, email, or sign-up link), **Ustawienia → Ogólne** shows a persistent **„Twoje polecenie”** card instead of hiding the section:

- Referrer name and email
- Code or email entered at claim time
- Claim date
- Benefit hint (20% for 3 months on PRO/BUSINESS)
- CTA to plans while still on FREE

Server: `getWorkspaceReferralClaimView()` — UI: `ReferralClaimSettingsSection`.

---

## Billing integration — referral balance disclosure

Referrer rewards live as **Stripe customer balance** (credit). Stripe automatically reduces `amount_due` on upcoming invoices. The app now **surfaces this in UI** so owners understand why the next invoice is lower than the monthly subscription.

### How it is computed

`parseCustomerBalanceAppliedCents()` reads Stripe invoice preview fields:

```typescript
applied = ending_balance - starting_balance  // when starting_balance < 0 (credit)
```

Used in:

- `getWorkspaceUpcomingInvoice()` — billing overview card
- `previewWorkspaceBillingChange()` — plan/add-on change modal

### UI surfaces

| Surface | Component | When shown |
| --- | --- | --- |
| **Następna faktura** (billing overview) | `subscription-impact-summary.tsx` | Breakdown line „Saldo programu poleceń” when `referralBalanceAppliedCents > 0` |
| **Podsumowanie zmian** (preview dialog) | `billing-change-preview-dialog.tsx` | Same line + note when add-on proration + balance |

Breakdown example (renewal only):

```txt
Abonament (plan + dodatki): 249,99 zł
Saldo programu poleceń: −110,00 zł
→ Najbliższa faktura: 139,99 zł
```

Breakdown example (add-on mid-cycle + balance):

```txt
Abonament: 348,99 zł
Jednorazowa dopłata: +94,97 zł
Saldo programu poleceń: −110,00 zł
→ Najbliższa faktura: 333,96 zł
```

### Distinction: two referral concepts on billing

| Concept | Mechanism | UI label |
| --- | --- | --- |
| **Referred user coupon** | Stripe subscription discount (20%) | „Zniżka polecająca (20%)” |
| **Referrer reward balance** | Stripe customer balance credit | „Saldo programu poleceń” |

A user can theoretically have both (was referred + refers others). UI shows separate breakdown lines.

### Copy note (business vs Stripe mechanics)

Tooltip/copy states that referral balance applies to PRO/Business subscription and **does not discount add-ons** as a product rule. Stripe applies customer balance to the **total** `amount_due` (including proration for add-ons). The note explains intent to users; arithmetic follows Stripe.

### Balance consumption timing

- Balance is **not** consumed when confirming an add-on/plan change preview
- Balance is consumed when the **invoice is paid** (renewal or finalized invoice)
- Until then, partner dashboard still shows full „Dostępne saldo”; „Wykorzystane saldo” updates after Stripe reduces customer balance

### Known gaps (documented)

| Gap | Severity |
| --- | --- |
| `BillingCreditConfirmDialog` (credit/downgrade path) — no balance breakdown | Low |
| Stripe preview fallback — `referralBalanceAppliedCents: 0` if API fails | Low |
| Historical invoices in Stripe Portal — no in-app referral context | Low |
| Shared BillingCustomer — balance applies to any workspace on same owner customer | Edge case |

---

## Troubleshooting

### Symptom: referral ACTIVE, status „W przygotowaniu”, notification „Nie udało się przyznac nagrody”

**Typical cause:** Stripe grant used a **stale** `stripeCustomerId` from an old workspace billing account while KPI balance reads a **newer** valid customer.

Historical bug (fixed): `grantReferralBonus` resolved customer via **oldest owned workspace** → `resolveBillingCustomer()`. If that workspace pointed at a deleted Stripe customer (`No such customer: cus_…`), grant failed even though the referrer's active paid workspace had a valid customer.

**Diagnose:**

```bash
npm run audit:referral-kpi -- --email referrer@example.com
```

Look for `rewardStatus=FAILED`, `ledger=[…→null]`, and `failure:` line.

**Fix data:**

```bash
npm run prisma:backfill-missing-referral-credits
```

Uses `resolveReferrerStripeCustomerId()` — newest `BillingCustomer` first, skips deleted/missing Stripe customers.

**Fix in code (current):** [`referral-billing-customer.ts`](../src/features/referrals/lib/referral-billing-customer.ts) shared by grant, balance KPI, and backfill. `grantReferralBonus` also re-links existing balance transactions by `referralId` metadata before creating a new one.

---

## Server modules

| Module | Role |
| --- | --- |
| `referral-claim-service.ts` | Claim referral on workspace creation |
| `referral-activation-service.ts` | Activate referral on first paid subscription |
| `referral-credit-service.ts` | Grant Stripe balance; `getReferrerStripeBalanceCents()` |
| `referral-billing-customer.ts` | `resolveReferrerStripeCustomerId()`, `ensureReferrerStripeCustomerId()` (lazy create + race-safe) |
| `referral-earnings-summary.ts` | KPI aggregation for partner page |
| `referral-kpi-utils.ts` | Pure KPI helpers + `computeUsedReferralBalanceCents` |
| `get-partner-program-page-data.ts` | Page loader |

Billing:

| Module | Role |
| --- | --- |
| `parse-invoice-preview-lines.ts` | `parseCustomerBalanceAppliedCents` |
| `get-workspace-upcoming-invoice.ts` | Upcoming invoice + balance |
| `preview-billing-change.ts` | Change preview + balance |

---

## Scripts & verification

| Command | Purpose |
| --- | --- |
| `npm run test:referral-program` | Unit/invariant checks (claim, KPI, grant flow) |
| `npm run audit:referral-kpi -- --email user@example.com` | Audit KPI invariants vs Stripe balance for one referrer |
| `npm run prisma:backfill-referral-profiles` | Partner profiles for **all** workspace owners (recommended post-deploy, not required) |
| `npm run prisma:backfill-referral-activations` | Activate referrals when webhooks missed (localhost) |
| `npm run prisma:backfill-missing-referral-credits` | Grant missing Stripe balance for ledger rows without `stripeBalanceTxnId` |
| `tsx scripts/verify-invoice-preview-parser.ts` | Parser tests incl. customer balance applied |

### Localhost without webhooks

After referred user pays:

```bash
npm run prisma:backfill-referral-activations
# If ledger exists but Stripe credit missing:
npm run prisma:backfill-missing-referral-credits
```

Verify referrer:

```bash
npm run audit:referral-kpi -- --email referrer@example.com
```

---

## i18n

Namespaces: `referrals.*`, `billing.workspace.nextInvoice.breakdown.*`, `billing.workspace.preview.*` in `src/messages/{pl,en}/`.

---

## Manual test checklist

- [ ] Owner opens `/referrals`; sees link, 4 KPI cards, invitations table with plan badges
- [ ] Referred user signs up via `?ref=`; claim within window
- [ ] Referred user upgrades to PRO/BUSINESS; referrer gets GRANTED + Stripe balance
- [ ] Partner KPI: granted = sum of bonuses; available = Stripe balance; used = granted − available
- [ ] Billing overview: next invoice reduced by balance with breakdown line
- [ ] Add-on purchase preview: shows subscription + proration + balance + addons note
- [ ] After invoice paid: available balance decreases; used balance increases
- [ ] `npm run test:referral-program` passes
- [ ] `tsx scripts/verify-invoice-preview-parser.ts` passes

---

## File map

| Area | Path |
| --- | --- |
| Partner page | `src/app/.../referrals/page.tsx` |
| Panel UI | `src/features/referrals/components/partner-program-panel.tsx` |
| Hero images | `src/features/referrals/lib/referral-hero-images.ts`, `public/images/referrals/` |
| Billing breakdown UI | `subscription-impact-summary.tsx`, `billing-change-preview-dialog.tsx` |
| Types | `src/features/billing/billing-page-data.ts` (`referralBalanceAppliedCents`) |
| Schema | `prisma/schema.prisma` — `ReferralRewardStatus`, `Referral.rewardStatus` |

See also: [workspace-billing.md](workspace-billing.md) (next invoice section), [billing-stripe.md](../architecture/billing-stripe.md).
