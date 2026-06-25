import assert from "node:assert/strict";

import {
  EstimateImportEmptyStructureError,
  estimateVersionToTemplateDraft,
} from "@/features/estimate-templates/lib/estimate-to-template-draft";
import {
  ESTIMATE_TEMPLATE_MAX_ITEMS_PER_SECTION,
  ESTIMATE_TEMPLATE_MAX_SECTIONS,
} from "@/features/estimate-templates/lib/template-limits";
import type { VersionTreeClient } from "@/features/estimates/lib/serialize-estimate";

function buildVersionTree(
  sections: Array<{
    title: string;
    items: Array<{ name: string; unit?: string | null }>;
  }>,
): VersionTreeClient {
  return {
    id: "version-1",
    estimateId: "estimate-1",
    workspaceId: "workspace-1",
    versionNumber: 1,
    status: "DRAFT",
    archivedAt: null,
    marginPercent: 0,
    createdByUserId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    sections: sections.map((section, sectionIndex) => ({
      id: `section-${sectionIndex}`,
      workspaceId: "workspace-1",
      versionId: "version-1",
      title: section.title,
      sortOrder: sectionIndex,
      deletedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      lineItems: section.items.map((item, itemIndex) => ({
        id: `item-${sectionIndex}-${itemIndex}`,
        workspaceId: "workspace-1",
        sectionId: `section-${sectionIndex}`,
        name: item.name,
        unit: item.unit ?? null,
        quantity: 1,
        unitPrice: 100,
        vatRate: 23,
        sortOrder: itemIndex,
        deletedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      })),
    })),
  };
}

const mapped = estimateVersionToTemplateDraft({
  name: "  Imported template  ",
  description: "From estimate",
  versionTree: buildVersionTree([
    {
      title: "Section A",
      items: [
        { name: "Item 1", unit: "m2" },
        { name: "Item 2", unit: "szt." },
      ],
    },
    {
      title: "Section B",
      items: [{ name: "Item 3", unit: "h" }],
    },
  ]),
});

assert.equal(mapped.name, "Imported template");
assert.equal(mapped.description, "From estimate");
assert.equal(mapped.sections.length, 2);
assert.equal(mapped.sections[0]?.title, "Section A");
assert.equal(mapped.sections[0]?.items[0]?.name, "Item 1");
assert.equal(mapped.sections[0]?.items[0]?.unit, "m2");
assert.equal(mapped.sections[0]?.guidance, "");
assert.equal(mapped.sections[1]?.items[0]?.name, "Item 3");

const filtered = estimateVersionToTemplateDraft({
  name: "Filtered",
  versionTree: buildVersionTree([
    {
      title: "  ",
      items: [{ name: "Should be skipped" }],
    },
    {
      title: "Valid",
      items: [
        { name: "  " },
        { name: "Kept item", unit: "kpl" },
      ],
    },
  ]),
});

assert.equal(filtered.sections.length, 1);
assert.equal(filtered.sections[0]?.title, "Valid");
assert.equal(filtered.sections[0]?.items.length, 1);
assert.equal(filtered.sections[0]?.items[0]?.name, "Kept item");

const manySections = Array.from({ length: ESTIMATE_TEMPLATE_MAX_SECTIONS + 5 }, (_, index) => ({
  title: `Section ${index + 1}`,
  items: [{ name: `Item ${index + 1}` }],
}));

const importedSections = estimateVersionToTemplateDraft({
  name: "No section cap",
  versionTree: buildVersionTree(manySections),
});

assert.equal(importedSections.sections.length, ESTIMATE_TEMPLATE_MAX_SECTIONS + 5);

const manyItemsSection = {
  title: "Packed",
  items: Array.from({ length: ESTIMATE_TEMPLATE_MAX_ITEMS_PER_SECTION + 5 }, (_, index) => ({
    name: `Line ${index + 1}`,
  })),
};

const importedItems = estimateVersionToTemplateDraft({
  name: "No item cap",
  versionTree: buildVersionTree([manyItemsSection]),
});

assert.equal(
  importedItems.sections[0]?.items.length,
  ESTIMATE_TEMPLATE_MAX_ITEMS_PER_SECTION + 5,
);

let emptyThrown = false;
try {
  estimateVersionToTemplateDraft({
    name: "Empty",
    versionTree: buildVersionTree([{ title: "No items", items: [] }]),
  });
} catch (error) {
  emptyThrown = error instanceof EstimateImportEmptyStructureError;
}
assert.equal(emptyThrown, true);

console.log("estimate-to-template-draft.test.ts: all assertions passed");
