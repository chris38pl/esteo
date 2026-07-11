# Ops Cases (v1)

Production ops queue for **user-account and transaction failures** - separate from the staging-only [Issue Tracker](./issue-tracker.md).

v1 scope: **`REFERRAL_REWARD_FAILED` only**.

---

## Routes

| Route | Access |
| --- | --- |
| `/dashboard/admin/ops-cases` | `PLATFORM_ADMIN` (extensible via `canAccessOpsCases()`) |
| `/dashboard/admin/ops-cases/[number]` | Detail + RESOLVED / IGNORED |

Admin layout already enforces platform admin.

---

## Model summary

- **Classification:** `type` (what failed), `fingerprint` (grouping), `source` (who emitted)
- **Dedupe:** `dedupeKey` per business entity; bump only when **OPEN/IN_PROGRESS** exists; after RESOLVED/IGNORED → new case with same key
- **Timeline:** `firstSeenAt`, `lastSeenAt`, `occurrenceCount`
- **People:** `affectedUserId`, `actorUserId` (optional)
- **SLA field:** `dueAt` (set from severity; overdue UI in phase 2)
- **Assignment fields:** `ownerUserId`, `assignedToUserId` (DB only in v1)

Partial unique index: one active case per `dedupeKey`.

---

## v1 sources

| Source | Trigger |
| --- | --- |
| `REFERRAL_SERVICE` | `grantReferralBonus()` → FAILED |
| `RECONCILIATION_CRON` | Trigger.dev `ops-referral-reconciliation` (every 6h) |

---

## Notifications

- Type: `ops_case_opened`
- Recipients: `ops_team` (v1 = all `PLATFORM_ADMIN`)
- Emitted **only on new case create**, not on dedupe bump

### Phase 2 (documented, not implemented)

`ops_case_escalated` when `occurrenceCount >= 10` on an active case.

---

## Module map

```txt
src/features/ops-cases/
  lib/ops-case-catalog.ts
  lib/ops-case-dedupe-key.ts
  server/emit-ops-case.ts
  server/emit-referral-reward-failed-ops-case.ts
  server/repository.ts
  server/admin-actions.ts
  components/admin-ops-cases-list-panel.tsx
  components/admin-ops-case-detail-panel.tsx

src/trigger/ops-referral-reconciliation.ts
src/server/permissions/can-access-ops-cases.ts
docs/runbooks/referral-failure.md
```

---

## Validation checklist (before adding new types)

- [ ] Case auto-created on failure
- [ ] Visible in admin list + summary strip
- [ ] `ops_case_opened` notification received
- [ ] Dedupe bump on retry (same active case)
- [ ] New case after RESOLVED + re-fail
- [ ] RESOLVED / IGNORED workflow comfortable
- [ ] Runbook commands usable from detail

---

## Phase 2 roadmap

- Billing drift, webhook failures, subscription mismatch types
- `/dashboard/admin/ops` dashboard (MTTR, Top-N fingerprint, recurring entities)
- Take case / Assign / Reassign UI
- Overdue SLA filter, Slack alerts
- `ops_case_escalated` notifications
