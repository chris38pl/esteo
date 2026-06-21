# Runbook: Referral reward failed

When `Referral.rewardStatus = FAILED` or an OpsCase `REFERRAL_REWARD_FAILED` is open.

---

## Symptoms

- Referrer received in-app notification: referral reward failed
- OpsCase auto-created (source: `REFERRAL_SERVICE` or `RECONCILIATION_CRON`)
- Partner dashboard may still show “Processing” for the failed referral

---

## Diagnose

1. Open OpsCase detail in `/dashboard/admin/ops-cases/[number]`
2. Check `summary` / payload `failureReason`
3. Run audit for referrer email:

```bash
npm run audit:referral-kpi -- --email referrer@example.com
```

Common causes:

- Stale or missing Stripe customer ID for referrer
- Stripe API error during `createBalanceTransaction`
- Referrer has no valid billing customer

---

## Fix

1. After fixing root cause (Stripe customer, billing data):

```bash
npm run prisma:backfill-missing-referral-credits
```

Use `--dry-run` first if unsure.

2. Re-run audit to confirm `rewardStatus = GRANTED` and ledger has `stripeBalanceTxnId`

3. Mark OpsCase **RESOLVED** with notes (e.g. backfill date, `cbtxn_xxx`)

---

## Ignore (false positive)

If failure is expected (fraud flag, ineligible plan, test data):

- Mark OpsCase **IGNORED** with explanation
- Do not run backfill

---

## Related

- Feature spec: [ops-cases.md](../features/ops-cases.md)
- Referral program: [referral-program.md](../features/referral-program.md)
