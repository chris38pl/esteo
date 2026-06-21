# Referral grant — stale Stripe customer on oldest workspace

**Date:** 2026-06-21  
**Status:** Resolved  
**Affected:** Partner program reward grant (`grantReferralBonus`), referrer KPI balance, notifications

Referrer `chazychaz38@wp.pl` received notification **„Nie udało się przyznać nagrody”** after referred workspace **BudMar** (`marian.kowal5003@interia.pl`) activated BUSINESS. Third referral row stayed **„W przygotowaniu”** while KPI showed 110 zł granted/available (only two prior rewards).

---

## Symptom

- Referred user claimed referral code in settings and upgraded to BUSINESS — referral row `ACTIVE`, bonus 80 zł projected.
- Referrer dashboard: third invitation **W przygotowaniu** (not **Przyznana**).
- Notification: **Nie udało się przyznać nagrody**.
- Hero KPI: **Przyznane nagrody 110 zł** / **Dostępne saldo 110 zł** (unchanged — only two Stripe credits applied).
- `npm run audit:referral-kpi -- --email chazychaz38@wp.pl` showed `budmar`: `rewardStatus=FAILED`, `failure: No such customer: 'cus_UhdGtNM1uyBGHb'`.

Claim and activation were correct; only the Stripe balance credit step failed.

---

## Root cause

`grantReferralBonus` resolved the Stripe customer via **oldest owned workspace**:

```typescript
const ownedWorkspace = await prisma.workspace.findFirst({
  where: { ownerId: referrerUserId },
  orderBy: { createdAt: "asc" },
});
const { stripeCustomerId } = await resolveBillingCustomer(ownedWorkspace.id);
```

That workspace’s `BillingAccount` pointed at **`cus_UhdGtNM1uyBGHb`** (deleted / missing in Stripe).

Meanwhile `getReferrerStripeBalanceCents` read balance from the **newest** `BillingCustomer` for the owner (`orderBy: { createdAt: "desc" }`) → **`cus_UjVweM7yb5VvZv`** (valid, 110 zł from two earlier grants).

**Read path and write path used different Stripe customers** when a referrer owned multiple workspaces with divergent billing records.

---

## Fix

1. **Shared helper** [`referral-billing-customer.ts`](../../src/features/referrals/lib/referral-billing-customer.ts):
   - `resolveReferrerStripeCustomerId()` — newest `BillingCustomer` first, skip deleted/missing Stripe customers.
   - `findReferralBalanceTransactionId()` — idempotent re-link before creating a new balance transaction.

2. **`grantReferralBonus`** — use helper instead of oldest-workspace `resolveBillingCustomer`; retry ledger rows missing `stripeBalanceTxnId`.

3. **Backfill + audit scripts** — same helper for consistency.

4. **Data repair** for chaz:

   ```bash
   npm run prisma:backfill-missing-referral-credits
   ```

   Result: `budmar` → `GRANTED`, `cbtxn_1TkkNDGaRlSwhDcIVLaKbmDM`, KPI 190 zł / 190 zł.

---

## Verification

```bash
npm run test:referral-program
npm run audit:referral-kpi -- --email chazychaz38@wp.pl
```

Expected: all referrals `GRANTED` with cbtxn; `processingBalanceCents: 0`; `granted = available` when nothing consumed.

---

## Prevention / debugging

| Check | Command / location |
| --- | --- |
| Per-referral grant state | `npm run audit:referral-kpi -- --email <referrer>` |
| Missing Stripe credits | `npm run prisma:backfill-missing-referral-credits` |
| Product docs | [`docs/features/referral-program.md`](../features/referral-program.md) — Troubleshooting |

When debugging similar cases: if KPI balance looks correct but a new referral stays in processing, compare `rewardFailureReason` on the `Referral` row — **`No such customer`** strongly suggests stale workspace-scoped billing customer vs owner-level resolution.

---

## Related files

- `src/features/referrals/lib/referral-billing-customer.ts`
- `src/features/referrals/server/referral-credit-service.ts`
- `scripts/backfill-missing-referral-stripe-credits.ts`
- `scripts/audit-referral-kpi.ts`
