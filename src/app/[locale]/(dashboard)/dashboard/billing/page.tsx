import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { getAccessibleWorkspaces } from "@/features/workspaces/server/accessible-workspaces";
import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveActiveWorkspace } from "@/server/workspaces/active-workspace";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);
  const t = await getServerTranslations(resolvedLocale, "billing");

  const user = await requireAuth(resolvedLocale);
  const accessible = await getAccessibleWorkspaces(user.id);
  const activeId = await resolveActiveWorkspace(user.id);
  const activeWorkspace = accessible.find((workspace) => workspace.id === activeId) ?? accessible[0];

  const dashboardHref = activeWorkspace
    ? `/${resolvedLocale}/dashboard/${activeWorkspace.slug}`
    : `/${resolvedLocale}/dashboard`;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col py-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t("soon")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <Link href={dashboardHref} className="mt-8 text-sm font-medium text-primary underline">
        {t("backToDashboard")}
      </Link>
    </main>
  );
}
