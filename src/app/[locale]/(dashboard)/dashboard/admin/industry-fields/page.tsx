import {

  BusinessDocumentType,

  WorkspaceIndustry,

} from "@prisma/client";

import { setRequestLocale } from "next-intl/server";



import { IndustryFieldsAdminPanel } from "@/features/industry-fields/components/industry-fields-admin-panel";
import { IndustryEstimateSectionsAdminPanel } from "@/features/workspaces/components/industry-estimate-sections-admin-panel";

import { listFieldDefinitions } from "@/features/industry-fields/server/repository";

import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";

import type { Locale } from "@/lib/locale";

import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";



function parseIndustry(value: string | undefined): WorkspaceIndustry {

  if (value && Object.values(WorkspaceIndustry).includes(value as WorkspaceIndustry)) {

    return value as WorkspaceIndustry;

  }



  return WorkspaceIndustry.CONSTRUCTION;

}



function parseDocumentType(value: string | undefined): BusinessDocumentType {

  if (

    value &&

    Object.values(BusinessDocumentType).includes(value as BusinessDocumentType)

  ) {

    return value as BusinessDocumentType;

  }



  return BusinessDocumentType.ESTIMATE_REQUEST;

}



export default async function IndustryFieldsAdminPage({

  params,

  searchParams,

}: {

  params: Promise<{ locale: string }>;

  searchParams: Promise<{ industry?: string; documentType?: string }>;

}) {

  const { locale: localeParam } = await params;

  const query = await searchParams;

  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);



  setRequestLocale(resolvedLocale);



  await assertPlatformAdminAccess(resolvedLocale);

  const t = await getServerTranslations(resolvedLocale, "admin.industryFields");



  const industry = parseIndustry(query.industry);

  const documentType = parseDocumentType(query.documentType);

  const definitions = await listFieldDefinitions({ industry, documentType });



  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

      </div>



      <IndustryFieldsAdminPanel

        key={`${industry}-${documentType}`}

        locale={resolvedLocale}

        initialIndustry={industry}

        initialDocumentType={documentType}

        initialDefinitions={definitions}

      />

      <IndustryEstimateSectionsAdminPanel
        locale={resolvedLocale}
        initialIndustry={industry}
      />

    </div>

  );

}

