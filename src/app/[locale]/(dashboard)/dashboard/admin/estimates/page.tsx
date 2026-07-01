import { setRequestLocale } from "next-intl/server";

import { AdminEstimatesListPanel } from "@/features/estimates/admin-list/components/admin-estimates-list-panel";
import type { EstimateListDateRange } from "@/features/estimates/lib/estimate-list-filter";
import {
  getAdminEstimatesListStats,
  listAdminEstimateWorkspaceFilterOptions,
  listAdminEstimatesPaginated,
  parseAdminEstimatesListFilters,
} from "@/features/estimates/server/admin-estimates";
import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { parsePaginationParams } from "@/lib/pagination";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

function parseInitialDateRange(query: {
  dateField?: string;
  dateFrom?: string;
  dateTo?: string;
}): EstimateListDateRange {
  const dateFields = new Set(["updated", "created", "requestCreated"]);
  const field = query.dateField;
  const parsedField =
    field && dateFields.has(field)
      ? (field as EstimateListDateRange["field"])
      : "updated";

  const parseDate = (value: string | undefined): Date | null => {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  return {
    field: parsedField,
    from: parseDate(query.dateFrom),
    to: parseDate(query.dateTo),
  };
}

export default async function AdminEstimatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    workspaceId?: string;
    status?: string;
    dateField?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const { locale: localeParam } = await params;
  const query = await searchParams;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  await assertPlatformAdminAccess(resolvedLocale);
  const t = await getServerTranslations(resolvedLocale, "admin.estimates");

  const pagination = parsePaginationParams(query);
  const filters = parseAdminEstimatesListFilters(query);
  const initialDateRange = parseInitialDateRange(query);

  const [data, statsEstimates, workspaceOptions] = await Promise.all([
    listAdminEstimatesPaginated(pagination, filters, resolvedLocale),
    getAdminEstimatesListStats(filters, resolvedLocale),
    listAdminEstimateWorkspaceFilterOptions(),
  ]);

  const panelKey = [
    data.page,
    data.pageSize,
    query.search ?? "",
    query.workspaceId ?? "",
    query.status ?? "",
    query.dateField ?? "",
    query.dateFrom ?? "",
    query.dateTo ?? "",
  ].join("-");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AdminEstimatesListPanel
        key={panelKey}
        locale={resolvedLocale}
        initialData={data}
        statsEstimates={statsEstimates}
        workspaceOptions={workspaceOptions}
        initialSearch={query.search ?? ""}
        initialWorkspaceId={query.workspaceId?.trim() || null}
        initialStatus={filters.status ?? null}
        initialDateRange={initialDateRange}
      />
    </div>
  );
}
