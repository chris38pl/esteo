import { setRequestLocale } from "next-intl/server";

import { AdminUsersPanel } from "@/features/users/components/admin-users-panel";
import { listAdminUsersPaginated } from "@/features/users/server/admin-users";
import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { parsePaginationParams } from "@/lib/pagination";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; pageSize?: string; search?: string }>;
}) {
  const { locale: localeParam } = await params;
  const query = await searchParams;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  await assertPlatformAdminAccess(resolvedLocale);
  const t = await getServerTranslations(resolvedLocale, "admin.users");
  const pagination = parsePaginationParams(query);
  const data = await listAdminUsersPaginated(pagination, { search: query.search });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AdminUsersPanel
        key={`${data.page}-${data.pageSize}-${query.search ?? ""}`}
        locale={resolvedLocale}
        initialData={data}
        initialSearch={query.search ?? ""}
      />
    </div>
  );
}
