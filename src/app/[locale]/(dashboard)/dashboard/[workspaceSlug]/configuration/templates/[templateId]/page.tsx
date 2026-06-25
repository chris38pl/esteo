import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { SyncDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/sync-dashboard-breadcrumb-detail";
import { EstimateTemplateEditor } from "@/features/estimate-templates/components/estimate-template-editor";
import { templateToEditorDraft } from "@/features/estimate-templates/lib/template-editor-draft";
import { hasSystemEstimateTemplateForIndustry } from "@/features/estimate-templates/config/system-templates";
import { getEstimateTemplateWorkspaceData } from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { WorkspaceError } from "@/server/permissions/errors";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function EditEstimateTemplatePage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string; templateId: string }>;
}) {
  const { locale, workspaceSlug, templateId } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  let data;
  try {
    data = await getEstimateTemplateWorkspaceData(user, resolved.workspace.id, templateId);
  } catch (error) {
    if (error instanceof WorkspaceError) {
      redirect(
        `/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/configuration?tab=templates`,
      );
    }
    throw error;
  }

  if (!data.template) {
    redirect(
      `/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/configuration?tab=templates`,
    );
  }

  return (
    <>
      <SyncDashboardBreadcrumbDetail label={data.template.name} />
      <EstimateTemplateEditor
        templateId={data.template.id}
        initialDraft={templateToEditorDraft(data.template)}
        initialUpdatedAt={data.template.updatedAt}
        templates={data.templates}
        defaultTemplateId={data.defaultTemplateId}
        workspaceId={resolved.workspace.id}
        workspaceSlug={resolved.canonicalSlug}
        locale={resolvedLocale}
        access={data.access}
        showSystemTemplate={hasSystemEstimateTemplateForIndustry(resolved.workspace.industry)}
      />
    </>
  );
}
