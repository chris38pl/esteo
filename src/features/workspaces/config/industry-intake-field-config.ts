import { WorkspaceIndustry } from "@prisma/client";

import type { IndustryFieldForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";

export type IntakeSurface = "public" | "internal";

/** Which catalog field keys appear per industry and intake surface. `null` = all active fields. */
export function getIntakeFieldKeys(
  industry: WorkspaceIndustry,
  surface: IntakeSurface,
): string[] | null {
  if (industry === WorkspaceIndustry.CARPENTRY) {
    const keys = ["product_categories", "project_types"];
    if (surface === "internal") {
      return [...keys, "budget_tier"];
    }
    return keys;
  }

  if (industry === WorkspaceIndustry.ELECTRICAL) {
    return ["building_type"];
  }

  return null;
}

export function filterIndustryFieldsForIntake(
  fields: IndustryFieldForDocument[],
  industry: WorkspaceIndustry,
  surface: IntakeSurface,
): IndustryFieldForDocument[] {
  const allowed = getIntakeFieldKeys(industry, surface);
  if (!allowed) {
    return fields;
  }
  const allowedSet = new Set(allowed);
  return fields
    .filter((field) => allowedSet.has(field.key))
    .sort((a, b) => allowed.indexOf(a.key) - allowed.indexOf(b.key));
}
