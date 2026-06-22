"use client";

import { ReferralClaimSettingsSection } from "@/features/referrals/components/referral-claim-settings-section";
import type { WorkspaceReferralClaimView } from "@/features/referrals/server/get-workspace-referral-claim-view";
import type { Locale } from "@/lib/locale";

export function WorkspaceSettingsReferralTab({
  workspaceId,
  workspaceSlug,
  locale,
  referralClaim,
}: {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  referralClaim: WorkspaceReferralClaimView | null;
}) {
  return (
    <ReferralClaimSettingsSection
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
      locale={locale}
      referralClaim={referralClaim}
    />
  );
}
