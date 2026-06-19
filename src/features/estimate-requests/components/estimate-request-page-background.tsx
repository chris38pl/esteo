import type { WorkspaceIndustry } from "@prisma/client";

import { HeroCardArtwork } from "@/components/hero-card/hero-card-artwork";
import { resolveEstimateRequestHeroAssets } from "@/features/estimate-requests/config/estimate-request-hero-images";

export function EstimateRequestPageBackground({
  industry,
}: {
  industry: WorkspaceIndustry;
}) {
  const hero = resolveEstimateRequestHeroAssets(industry);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <HeroCardArtwork lightSrc={hero.light} darkSrc={hero.dark} align="left" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_40%),radial-gradient(circle_at_80%_15%,rgba(99,102,241,0.14),transparent_45%)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.18),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.16),transparent_45%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/55 to-background/95" />
    </div>
  );
}
