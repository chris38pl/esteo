import {
  compareEstimateVersions,
  type VersionComparisonSummary,
} from "@/features/estimates/lib/compare-estimate-versions";
import type { EstimateVersionSnapshot } from "@/features/estimates/lib/estimate-agent-types";

const snapshot: EstimateVersionSnapshot = {
  marginPercent: 0,
  sections: [
    {
      id: "s1",
      title: "Prace",
      sortOrder: 0,
      items: [
        {
          id: "i1",
          name: "Pozycja A",
          quantity: 1,
          unitPrice: 1000,
          vatRate: 0.23,
          sortOrder: 0,
        },
        {
          id: "i2",
          name: "Pozycja B",
          quantity: 2,
          unitPrice: 500,
          vatRate: 0.23,
          sortOrder: 1,
        },
      ],
    },
  ],
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const identical = compareEstimateVersions({
  baseSnapshot: snapshot,
  targetSnapshot: snapshot,
  baseVersionNumber: 1,
  targetVersionNumber: 2,
  baseTotalGross: 50000,
  targetTotalGross: 50000,
});

assert(identical.grossDelta === 0, "identical versions should have zero gross delta");
assert(identical.addedItemsCount === 0, "identical versions should have zero added items");
assert(identical.removedItemsCount === 0, "identical versions should have zero removed items");

const withAddedItem: EstimateVersionSnapshot = {
  ...snapshot,
  sections: [
    {
      ...snapshot.sections[0],
      items: [
        ...snapshot.sections[0].items,
        {
          id: "i3",
          name: "Pozycja C",
          quantity: 1,
          unitPrice: 800,
          vatRate: 0.23,
          sortOrder: 2,
        },
      ],
    },
  ],
};

const added = compareEstimateVersions({
  baseSnapshot: snapshot,
  targetSnapshot: withAddedItem,
  baseVersionNumber: 1,
  targetVersionNumber: 2,
  baseTotalGross: 50000,
  targetTotalGross: 54800,
});

assert(added.addedItemsCount === 1, `expected 1 added item, got ${added.addedItemsCount}`);
assert(added.removedItemsCount === 0, "expected zero removed items");
assert(added.grossDelta === 4800, `expected gross delta 4800, got ${added.grossDelta}`);

const withRemovedItem: EstimateVersionSnapshot = {
  ...snapshot,
  sections: [
    {
      ...snapshot.sections[0],
      items: [snapshot.sections[0].items[0]],
    },
  ],
};

const removed = compareEstimateVersions({
  baseSnapshot: snapshot,
  targetSnapshot: withRemovedItem,
  baseVersionNumber: 2,
  targetVersionNumber: 3,
  baseTotalGross: 50000,
  targetTotalGross: 45000,
});

assert(removed.removedItemsCount === 1, `expected 1 removed item, got ${removed.removedItemsCount}`);
assert(removed.addedItemsCount === 0, "expected zero added items");

console.log("verify-compare-estimate-versions: ok");
