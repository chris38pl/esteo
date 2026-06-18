/**
 * SubscriptionChange CRUD checks against a throwaway in-memory pattern.
 * Full DB integration is covered by plan-change + subscription-sync wiring;
 * this script validates helper invariants without a live database.
 */

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

type ChangeRow = {
  id: string;
  subscriptionId: string;
  type: "PLAN_DOWNGRADE";
  targetPlan: "PRO" | "BUSINESS";
  effectiveAt: Date;
  canceledAt: Date | null;
};

const store: ChangeRow[] = [];
let idCounter = 0;

function createPlanDowngradeChange(params: {
  subscriptionId: string;
  targetPlan: "PRO" | "BUSINESS";
  effectiveAt: Date;
}): ChangeRow {
  cancelActiveSubscriptionChanges(params.subscriptionId);
  const row: ChangeRow = {
    id: `chg_${++idCounter}`,
    subscriptionId: params.subscriptionId,
    type: "PLAN_DOWNGRADE",
    targetPlan: params.targetPlan,
    effectiveAt: params.effectiveAt,
    canceledAt: null,
  };
  store.push(row);
  return row;
}

function cancelActiveSubscriptionChanges(subscriptionId: string): void {
  const now = new Date();
  for (const row of store) {
    if (row.subscriptionId === subscriptionId && row.canceledAt === null) {
      row.canceledAt = now;
    }
  }
}

function getActiveSubscriptionChange(subscriptionId: string): ChangeRow | null {
  return (
    store
      .filter((row) => row.subscriptionId === subscriptionId && row.canceledAt === null)
      .sort((a, b) => b.effectiveAt.getTime() - a.effectiveAt.getTime())[0] ?? null
  );
}

console.log("subscription-change: create / cancel / single active");

const subId = "sub_test";
const first = createPlanDowngradeChange({
  subscriptionId: subId,
  targetPlan: "PRO",
  effectiveAt: new Date("2026-07-01"),
});
assert(getActiveSubscriptionChange(subId)?.id === first.id, "active change returned after create");

createPlanDowngradeChange({
  subscriptionId: subId,
  targetPlan: "PRO",
  effectiveAt: new Date("2026-08-01"),
});
const active = getActiveSubscriptionChange(subId);
assert(active?.effectiveAt.toISOString() === new Date("2026-08-01").toISOString(), "only latest active change");
assert(
  store.filter((row) => row.subscriptionId === subId && row.canceledAt !== null).length === 1,
  "previous change canceled when rescheduling",
);

cancelActiveSubscriptionChanges(subId);
assert(getActiveSubscriptionChange(subId) === null, "cancel clears active change");
assert(
  store.every((row) => row.subscriptionId !== subId || row.canceledAt !== null),
  "all rows for subscription are canceled",
);

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}

console.log("\nAll subscription-change checks passed.");
