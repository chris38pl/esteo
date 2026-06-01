import { redirect } from "next/navigation";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import { WorkspaceSettingsPanel } from "@/features/workspaces/components/workspace-settings-panel";
import { getWorkspaceSettingsPageData } from "@/features/workspaces/server/get-workspace-settings-page-data";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveActiveWorkspace } from "@/server/workspaces/active-workspace";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const activeWorkspaceId = await resolveActiveWorkspace(user.id);

  if (!activeWorkspaceId) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  const data = await getWorkspaceSettingsPageData(user, activeWorkspaceId);

  if (!data) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  const { workspace, members, invitations, rules, canInviteMembers } = data;

  const brandingResult = workspaceBrandingSchema.safeParse(
    workspace.settings?.branding ?? {},
  );
  const initialBranding = brandingResult.success ? brandingResult.data : null;

  return (
    <Suspense>
      <WorkspaceSettingsPanel
        workspaceId={workspace.id}
        initialName={workspace.name}
        initialAppearanceTheme={workspace.appearanceTheme}
        initialCompanyDescription={workspace.settings?.companyDescription ?? ""}
        initialAiInstructions={workspace.settings?.aiInstructions ?? ""}
        initialBranding={initialBranding}
        members={members.map((member) => ({
          id: member.id,
          role: member.role,
          user: {
            name: member.user.name,
            email: member.user.email,
            avatarUrl: member.user.avatarUrl,
          },
        }))}
        invitations={invitations}
        rules={rules}
        canInviteMembers={canInviteMembers}
        locale={resolvedLocale}
      />
    </Suspense>
  );
}
