import { redirect } from "next/navigation";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import { WorkspaceSettingsPanel } from "@/features/workspaces/components/workspace-settings-panel";
import { getWorkspaceSettingsPageData } from "@/features/workspaces/server/get-workspace-settings-page-data";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);

  // Free cache hit - resolved by the parent [workspaceSlug]/layout.tsx already.
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  const data = await getWorkspaceSettingsPageData(user, resolved.workspace.id);

  if (!data) {
    redirect(dashboardEstimatesHref(resolvedLocale, resolved.canonicalSlug));
  }

  const {
    workspace,
    members,
    invitations,
    rules,
    canInviteMembers,
    transferEligibility,
    pendingTransfer,
    deleteEligibility,
  } = data;

  const isOwner = workspace.ownerId === user.id;

  const referralClaim = isOwner
    ? await import("@/features/referrals/server/get-workspace-referral-claim-view").then((m) =>
        m.getWorkspaceReferralClaimView(workspace.id),
      )
    : null;

  const brandingResult = workspaceBrandingSchema.safeParse(
    workspace.settings?.branding ?? {},
  );
  const initialBranding = brandingResult.success ? brandingResult.data : null;

  return (
    <Suspense>
      <WorkspaceSettingsPanel
        workspaceId={workspace.id}
        workspaceIndustry={workspace.industry}
        initialIndustryOtherText={workspace.industryOtherText ?? ""}
        initialName={workspace.name}
        initialCompanyDescription={workspace.settings?.companyDescription ?? ""}
        initialCompanyAddress={workspace.settings?.companyAddress ?? ""}
        initialCompanyTaxId={workspace.settings?.companyTaxId ?? ""}
        initialCompanyEmail={workspace.settings?.companyEmail ?? ""}
        initialCompanyPhone={workspace.settings?.companyPhone ?? ""}
        initialBranding={initialBranding}
        members={members.map((member) => ({
          id: member.id,
          userId: member.userId,
          role: member.role,
          joinedAt: member.createdAt.toISOString(),
          user: {
            name: member.user.name,
            email: member.user.email,
            avatarUrl: member.user.avatarUrl,
            avatarPreset: isAvatarPreset(member.user.avatarPreset)
              ? member.user.avatarPreset
              : null,
          },
        }))}
        invitations={invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          invitedAt: invitation.createdAt.toISOString(),
        }))}
        rules={rules}
        canInviteMembers={canInviteMembers}
        locale={resolvedLocale}
        workspaceSlug={workspace.slug}
        isOwner={isOwner}
        ownerUserId={workspace.ownerId}
        transferEligibility={{
          eligible: transferEligibility.eligible,
          blockReason: transferEligibility.blockReason,
          plan: transferEligibility.plan,
          cancelAtPeriodEnd: transferEligibility.cancelAtPeriodEnd,
          currentPeriodEnd: transferEligibility.currentPeriodEnd?.toISOString() ?? null,
          effectiveStatus: transferEligibility.effectiveStatus,
        }}
        pendingTransfer={
          pendingTransfer
            ? {
                id: pendingTransfer.id,
                toEmail: pendingTransfer.toEmail,
                expiresAt: pendingTransfer.expiresAt.toISOString(),
                keepSenderAsMember: pendingTransfer.keepSenderAsMember,
                planSnapshot: pendingTransfer.planSnapshot,
                periodEndSnapshot: pendingTransfer.periodEndSnapshot.toISOString(),
              }
            : null
        }
        deleteEligibility={deleteEligibility}
        referralClaim={referralClaim}
      />
    </Suspense>
  );
}
