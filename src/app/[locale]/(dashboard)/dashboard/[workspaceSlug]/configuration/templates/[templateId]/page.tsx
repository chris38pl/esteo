import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { SyncDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/sync-dashboard-breadcrumb-detail";
import { createAppMetadata } from "@/features/app/metadata/create-app-metadata";
import { getTemplateDocumentTitle } from "@/features/app/metadata/get-entity-document-title";
import { EstimateTemplateEditor } from "@/features/estimate-templates/components/estimate-template-editor";
import { templateToEditorDraft } from "@/features/estimate-templates/lib/template-editor-draft";
import { hasSystemEstimateTemplateForIndustry } from "@/features/estimate-templates/config/system-templates";
import { getEstimateTemplateWorkspaceData } from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { WorkspaceError } from "@/server/permissions/errors";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";
import { resolveRequestLocale } from "@/i18n/request-locale";
import { prisma } from "@/db/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string; templateId: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, workspaceSlug, templateId } = await params;
  const locale = await resolveRequestLocale(localeParam);

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true, name: true },
  });

  if (!workspace) {
    return createAppMetadata({ title: "Esteo" });
  }

  const title = await getTemplateDocumentTitle({
    templateId,
    workspaceId: workspace.id,
    locale,
  });

  return createAppMetadata({ title });
}

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
