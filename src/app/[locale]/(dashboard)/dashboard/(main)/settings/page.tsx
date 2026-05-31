import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { WorkspaceCompanyDescriptionForm } from "@/features/workspaces/components/workspace-company-description-form";
import { findWorkspaceById } from "@/features/workspaces/server/repository";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";
import { resolveActiveWorkspace } from "@/server/workspaces/active-workspace";

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);
  const t = await getTranslations("workspaces.settings");

  const user = await requireAuth(resolvedLocale);
  const activeWorkspaceId = await resolveActiveWorkspace(user.id);

  if (!activeWorkspaceId) {
    redirect(`/${resolvedLocale}/dashboard/onboarding`);
  }

  try {
    await requireRole(user, activeWorkspaceId, "OWNER");
  } catch (error) {
    if (error instanceof PermissionError) {
      redirect(`/${resolvedLocale}/dashboard`);
    }
    throw error;
  }

  const workspace = await findWorkspaceById(activeWorkspaceId);

  if (!workspace) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="mt-8">
        <WorkspaceCompanyDescriptionForm
          workspaceId={workspace.id}
          initialCompanyDescription={workspace.settings?.companyDescription ?? ""}
          locale={resolvedLocale}
        />
      </div>
    </main>
  );
}
