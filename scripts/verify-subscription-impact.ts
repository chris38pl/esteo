import {
  addonRowsToQuantities,
  buildRecurringLineItems,
  computePlanImpactSummary,
  computeRecurringCents,
  projectAddonQuantitiesAfterPlanChange,
  splitLimitImpacts,
} from "../src/features/billing/lib/subscription-impact";

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

console.log("subscription-impact: buildRecurringLineItems");

const businessFull = buildRecurringLineItems("BUSINESS", { storage: 5, seats: 1 });
assert(businessFull.length === 3, "BUSINESS + storage×5 + seats×1 → 3 line items");
assert(
  businessFull.reduce((sum, item) => sum + item.cents, 0) === 54399,
  "BUSINESS bundle totals 543,99 PLN (54399 grosze)",
);

const proProjected = buildRecurringLineItems(
  "PRO",
  projectAddonQuantitiesAfterPlanChange("PRO", { storage: 5, seats: 1 }),
);
assert(proProjected.length === 2, "PRO projection drops seat packs → 2 line items");
assert(
  proProjected.reduce((sum, item) => sum + item.cents, 0) === 29499,
  "PRO + storage×5 totals 294,99 PLN",
);

const planImpact = computePlanImpactSummary({
  currentPlan: "BUSINESS",
  targetPlan: "PRO",
  currentAddons: { storage: 5, seats: 1 },
  effectiveAt: new Date("2026-07-18"),
  unlimitedLabel: "Unlimited",
});
assert(planImpact.timing.kind === "scheduled", "downgrade timing is scheduled");
assert(planImpact.recurringDeltaCents === 29499 - 54399, "recurring delta matches totals");
const { losses: downgradeLosses, gains: downgradeGains } = splitLimitImpacts(planImpact.limitImpacts);
assert(
  downgradeLosses.some((row) => row.key === "users" && row.direction === "loss"),
  "downgrade marks fewer users as loss",
);
assert(
  downgradeGains.length === 0 || !downgradeGains.some((row) => row.key === "users"),
  "downgrade does not mark user decrease as gain",
);

const downgradeWithExtraStorage = computePlanImpactSummary({
  currentPlan: "BUSINESS",
  targetPlan: "PRO",
  currentAddons: { storage: 5, seats: 1 },
  targetAddons: { storage: 6, seats: 0 },
  effectiveAt: new Date("2026-07-18"),
  unlimitedLabel: "Unlimited",
});
const { losses: mixedLosses, gains: mixedGains } = splitLimitImpacts(
  downgradeWithExtraStorage.limitImpacts,
);
assert(
  mixedLosses.some((row) => row.key === "users" && row.direction === "loss"),
  "downgrade with extra storage still marks user loss",
);
assert(
  mixedGains.some((row) => row.key === "storage" && row.direction === "gain"),
  "downgrade with extra storage marks storage gain",
);

const seatPackGain = computePlanImpactSummary({
  currentPlan: "BUSINESS",
  targetPlan: "BUSINESS",
  currentAddons: { storage: 5, seats: 1 },
  targetAddons: { storage: 5, seats: 2 },
  unlimitedLabel: "Unlimited",
});
const { gains: seatGains, losses: seatLosses } = splitLimitImpacts(seatPackGain.limitImpacts);
assert(
  seatGains.some((row) => row.key === "users" && row.direction === "gain"),
  "extra seat pack marks user increase as gain",
);
assert(
  !seatLosses.some((row) => row.key === "users"),
  "extra seat pack does not mark users under Utracisz",
);

const storageGain = computePlanImpactSummary({
  currentPlan: "BUSINESS",
  targetPlan: "BUSINESS",
  currentAddons: { storage: 5, seats: 1 },
  targetAddons: { storage: 6, seats: 1 },
  unlimitedLabel: "Unlimited",
});
const { gains: storageGains } = splitLimitImpacts(storageGain.limitImpacts);
assert(
  storageGains.some((row) => row.key === "storage" && row.direction === "gain"),
  "extra storage pack marks storage as gain",
);

const addonDelta = computeRecurringCents("PRO", { storage: 6, seats: 0 }) -
  computeRecurringCents("PRO", { storage: 5, seats: 0 });
assert(addonDelta === 3900, "+1 storage pack adds 39 PLN / month");

console.log("\nsubscription-impact: addonRowsToQuantities");
const quantities = addonRowsToQuantities([
  { addonKey: "STORAGE", quantity: 3 },
  { addonKey: "SEATS", quantity: 2 },
]);
assert(quantities.storage === 3 && quantities.seats === 2, "maps addon rows to quantities");

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}

console.log("\nAll subscription-impact checks passed.");
