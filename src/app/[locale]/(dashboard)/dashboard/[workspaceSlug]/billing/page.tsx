import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale: localeParam, workspaceSlug } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);
  const t = await getServerTranslations(resolvedLocale, "billing");

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

      <Link
        href={`/${resolvedLocale}/dashboard/${workspaceSlug}`}
        className="mt-8 text-sm font-medium text-primary underline"
      >
        {t("backToDashboard")}
      </Link>
    </main>
  );
}
