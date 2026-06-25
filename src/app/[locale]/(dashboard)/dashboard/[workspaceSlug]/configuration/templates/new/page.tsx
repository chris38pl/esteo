import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import {
  getSystemEstimateTemplateForIndustry,
  hasSystemEstimateTemplateForIndustry,
} from "@/features/estimate-templates/config/system-templates";
import { EstimateTemplateEditor } from "@/features/estimate-templates/components/estimate-template-editor";
import {
  emptyTemplateDraft,
  templateToEditorDraft,
} from "@/features/estimate-templates/lib/template-editor-draft";
import {
  getEstimateTemplateWorkspaceData,
  getWorkspaceConfigurationPageData,
} from "@/features/workspace-configuration/server/service";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { WorkspaceError } from "@/server/permissions/errors";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function NewEstimateTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
  searchParams: Promise<{ copy?: string; source?: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const { copy, source } = await searchParams;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  let workspaceData;
  let configuration;
  try {
    [workspaceData, configuration] = await Promise.all([
      getEstimateTemplateWorkspaceData(user, resolved.workspace.id),
      getWorkspaceConfigurationPageData(user, resolved.workspace.id),
    ]);
  } catch (error) {
    if (error instanceof WorkspaceError) {
      redirect(dashboardEstimatesHref(resolvedLocale, resolved.canonicalSlug));
    }
    throw error;
  }

  if (!configuration) {
    redirect(dashboardEstimatesHref(resolvedLocale, resolved.canonicalSlug));
  }

  const showSystemTemplate = hasSystemEstimateTemplateForIndustry(
    configuration.workspace.industry,
  );

  const initialDraft =
    source === "ai"
      ? emptyTemplateDraft()
      : copy === "system" && showSystemTemplate
        ? templateToEditorDraft(
            getSystemEstimateTemplateForIndustry(configuration.workspace.industry),
          )
        : emptyTemplateDraft();

  return (
    <EstimateTemplateEditor
        templateId={null}
        initialDraft={initialDraft}
        templates={workspaceData.templates}
        defaultTemplateId={workspaceData.defaultTemplateId}
        workspaceId={resolved.workspace.id}
        workspaceSlug={resolved.canonicalSlug}
        locale={resolvedLocale}
        access={workspaceData.access}
        showSystemTemplate={showSystemTemplate}
        initialSource={source === "ai" ? "ai" : null}
    />
  );
}
