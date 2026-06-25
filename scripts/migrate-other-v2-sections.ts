#!/usr/bin/env npx tsx
/**
 * Clears legacy OTHER default estimateSections from workspace branding.
 * Run after deploying OTHER v2: npx tsx scripts/migrate-other-v2-sections.ts
 */
import { WorkspaceIndustry } from "@prisma/client";

import { prisma } from "@/db/client";
import { isLegacyOtherDefaultSections } from "@/features/workspaces/lib/migrate-legacy-other-sections";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import type { WorkspaceEstimateSection } from "@/features/workspaces/schemas/estimate-sections";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const workspaces = await prisma.workspace.findMany({
    where: { industry: WorkspaceIndustry.OTHER },
    select: {
      id: true,
      name: true,
      industryOtherText: true,
      settings: { select: { branding: true } },
    },
  });

  let migrated = 0;
  let skippedCustom = 0;
  let skippedNone = 0;

  for (const workspace of workspaces) {
    const brandingResult = workspaceBrandingSchema.safeParse(workspace.settings?.branding ?? {});
    if (!brandingResult.success) {
      skippedNone++;
      continue;
    }

    const sections = brandingResult.data.estimateSections as
      | WorkspaceEstimateSection[]
      | undefined;
    if (!sections?.length) {
      skippedNone++;
      continue;
    }

    if (!isLegacyOtherDefaultSections(sections)) {
      skippedCustom++;
      console.log(
        `[skip-custom] ${workspace.id} (${workspace.industryOtherText ?? workspace.name})`,
      );
      continue;
    }

    const { estimateSections: _removed, ...brandingWithoutSections } = brandingResult.data;
    const mergedBranding = workspaceBrandingSchema.parse(brandingWithoutSections);

    if (!dryRun) {
      await prisma.workspaceSettings.updateMany({
        where: { workspaceId: workspace.id },
        data: { branding: mergedBranding },
      });
    }

    migrated++;
    console.log(
      `[${dryRun ? "dry-run" : "migrated"}] ${workspace.id} (${workspace.industryOtherText ?? workspace.name})`,
    );
  }

  console.log(
    JSON.stringify({ total: workspaces.length, migrated, skippedCustom, skippedNone, dryRun }, null, 2),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
