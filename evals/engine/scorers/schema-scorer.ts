import type { EstimateDraftOutput } from "@/ai/schemas/estimate-draft-output";
import type { SchemaScoreResult } from "@evals/engine/types";

export function scoreSchema(output: EstimateDraftOutput | null): SchemaScoreResult {
  const checks: SchemaScoreResult["checks"] = [];

  if (!output) {
    return {
      passed: false,
      checks: [{ id: "output_exists", passed: false, detail: "No output" }],
    };
  }

  const sectionsCheck = output.sections.length > 0;
  checks.push({
    id: "sections_nonempty",
    passed: sectionsCheck,
    detail: sectionsCheck ? `${output.sections.length} sections` : "No sections",
  });

  let totalItems = 0;
  for (const [si, section] of output.sections.entries()) {
    const titleOk = Boolean(section.title?.trim());
    checks.push({
      id: `section_${si}_title`,
      passed: titleOk,
      detail: titleOk ? section.title : "Empty section title",
    });

    const itemsOk = section.items.length > 0;
    checks.push({
      id: `section_${si}_items`,
      passed: itemsOk,
      detail: itemsOk ? `${section.items.length} items` : "Section has no items",
    });

    for (const [ii, item] of section.items.entries()) {
      totalItems += 1;
      const nameOk = Boolean(item.name?.trim());
      checks.push({
        id: `section_${si}_item_${ii}_name`,
        passed: nameOk,
        detail: nameOk ? "ok" : "Empty item name",
      });

      const qtyOk = typeof item.quantity === "number" && !Number.isNaN(item.quantity) && item.quantity >= 0;
      checks.push({
        id: `section_${si}_item_${ii}_quantity`,
        passed: qtyOk,
        detail: qtyOk ? String(item.quantity) : `Invalid quantity: ${item.quantity}`,
      });

      const priceOk =
        typeof item.unitPrice === "number" && !Number.isNaN(item.unitPrice) && item.unitPrice >= 0;
      checks.push({
        id: `section_${si}_item_${ii}_unitPrice`,
        passed: priceOk,
        detail: priceOk ? String(item.unitPrice) : `Invalid unitPrice: ${item.unitPrice}`,
      });

      const vatOk =
        typeof item.vatRate === "number" &&
        !Number.isNaN(item.vatRate) &&
        item.vatRate >= 0 &&
        item.vatRate <= 1;
      checks.push({
        id: `section_${si}_item_${ii}_vatRate`,
        passed: vatOk,
        detail: vatOk ? String(item.vatRate) : `Invalid vatRate: ${item.vatRate}`,
      });

      const sortOk = Number.isInteger(item.sortOrder);
      checks.push({
        id: `section_${si}_item_${ii}_sortOrder`,
        passed: sortOk,
        detail: sortOk ? String(item.sortOrder) : `Invalid sortOrder: ${item.sortOrder}`,
      });
    }
  }

  checks.push({
    id: "total_line_items",
    passed: totalItems > 0,
    detail: totalItems > 0 ? `${totalItems} line items` : "No line items",
  });

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}
