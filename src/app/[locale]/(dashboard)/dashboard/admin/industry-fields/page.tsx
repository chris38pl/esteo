import {
  BusinessDocumentType,
  WorkspaceIndustry,
} from "@prisma/client";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { IndustryFieldsAdminPanel } from "@/features/industry-fields/components/industry-fields-admin-panel";
import { listFieldDefinitions } from "@/features/industry-fields/server/repository";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
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
  const { locale } = await params;
  const query = await searchParams;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  await assertPlatformAdminAccess(resolvedLocale);
  const t = await getTranslations("admin.industryFields");

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
    </div>
  );
}
