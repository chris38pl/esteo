export type PartnerTier = "NONE" | "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

const TIER_THRESHOLDS: { tier: Exclude<PartnerTier, "NONE">; minActive: number }[] = [
  { tier: "DIAMOND", minActive: 25 },
  { tier: "GOLD", minActive: 10 },
  { tier: "SILVER", minActive: 3 },
  { tier: "BRONZE", minActive: 1 },
];

export function resolvePartnerTier(activeReferralCount: number): PartnerTier {
  for (const { tier, minActive } of TIER_THRESHOLDS) {
    if (activeReferralCount >= minActive) {
      return tier;
    }
  }
  return "NONE";
}

export function nextTierProgress(activeReferralCount: number): {
  currentTier: PartnerTier;
  nextTier: PartnerTier | null;
  activeCount: number;
  nextThreshold: number | null;
} {
  const currentTier = resolvePartnerTier(activeReferralCount);
  const tiersAsc = [...TIER_THRESHOLDS].reverse();
  const currentIdx = tiersAsc.findIndex((t) => t.tier === currentTier);
  const next = currentIdx >= 0 && currentIdx < tiersAsc.length - 1 ? tiersAsc[currentIdx + 1] : null;

  return {
    currentTier,
    nextTier: next?.tier ?? null,
    activeCount: activeReferralCount,
    nextThreshold: next?.minActive ?? null,
  };
}
