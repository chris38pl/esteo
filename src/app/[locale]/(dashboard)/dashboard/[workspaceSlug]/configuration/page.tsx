import { redirect } from "next/navigation";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { createAppMetadata } from "@/features/app/metadata/create-app-metadata";
import { resolvePageTitle } from "@/features/app/metadata/resolve-page-title";
import { WorkspaceConfigurationPanel } from "@/features/workspace-configuration/components/workspace-configuration-panel";
import { getWorkspaceConfigurationPageData } from "@/features/workspace-configuration/server/service";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
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
  const pathname = `/${resolvedLocale}/dashboard/${workspaceSlug}/configuration`;

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

export default async function WorkspaceConfigurationPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  const data = await getWorkspaceConfigurationPageData(user, resolved.workspace.id);

  if (!data) {
    redirect(dashboardEstimatesHref(resolvedLocale, resolved.canonicalSlug));
  }

  const brandingResult = workspaceBrandingSchema.safeParse(data.branding ?? {});
  const initialBranding = brandingResult.success ? brandingResult.data : null;

  return (
    <Suspense>
      <WorkspaceConfigurationPanel
        workspaceId={data.workspace.id}
        workspaceSlug={data.workspace.slug}
        workspaceIndustry={data.workspace.industry}
        industryOtherText={data.workspace.industryOtherText ?? ""}
        companyDescription={data.companyDescription}
        rules={data.rules}
        initialAiInstructions={data.aiInstructions}
        initialBranding={initialBranding}
        locale={resolvedLocale}
        templates={data.templates}
        defaultTemplateId={data.defaultEstimateTemplateId}
        systemTemplate={data.systemTemplate}
        access={data.access}
      />
    </Suspense>
  );
}
