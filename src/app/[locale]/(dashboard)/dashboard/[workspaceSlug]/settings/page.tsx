import { redirect } from "next/navigation";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { createAppMetadata } from "@/features/app/metadata/create-app-metadata";
import { resolvePageTitle } from "@/features/app/metadata/resolve-page-title";
import { WorkspaceSettingsPanel } from "@/features/workspaces/components/workspace-settings-panel";
import { getWorkspaceSettingsPageData } from "@/features/workspaces/server/get-workspace-settings-page-data";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";
import { resolveRequestLocale } from "@/i18n/request-locale";
import { prisma } from "@/db/client";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale: localeParam, workspaceSlug } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);
  const query = await searchParams;
  const pathname = `/${resolvedLocale}/dashboard/${workspaceSlug}/settings`;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { name: true },
  });

  const title = await resolvePageTitle({
    locale: resolvedLocale,
    pathname,
    searchParams: query,
    workspaceName: workspace?.name ?? null,
  });

  return createAppMetadata({ title });
}

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

  const integrationsFeatureState = isOwner
    ? await import("@/server/billing/entitlement-service").then((m) =>
        m.getFeatureState(workspace.id, "INTEGRATIONS"),
      )
    : "DISABLED";

  const integrationsEnabled = integrationsFeatureState === "ACTIVE";

  const [initialApiKeys, initialIntegrationSchema, initialIntegrationLogs] = isOwner
    ? await Promise.all([
        import("@/server/integrations/keys/service").then((m) =>
          m.listWorkspaceApiKeys(workspace.id),
        ),
        integrationsEnabled
          ? import("@/server/integrations/schema/builder").then((m) =>
              m.buildIntegrationSchemaForWorkspace({
                workspaceId: workspace.id,
                locale: resolvedLocale,
              }),
            )
          : Promise.resolve(null),
        integrationsEnabled
          ? import("@/server/integrations/logs/service").then((m) =>
              m.listIntegrationRequestLogs({ workspaceId: workspace.id, take: 50 }),
            )
          : Promise.resolve([]),
      ])
    : [[], null, []];

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
        integrationsEnabled={integrationsEnabled}
        billingPlansHref={`/${resolvedLocale}/dashboard/${workspace.slug}/billing/plans`}
        initialApiKeys={initialApiKeys}
        initialIntegrationSchema={initialIntegrationSchema}
        initialIntegrationLogs={initialIntegrationLogs}
      />
    </Suspense>
  );
}
