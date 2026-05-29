import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);
  const t = await getTranslations("billing");

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
        href={`/${resolvedLocale}/dashboard`}
        className="mt-8 text-sm font-medium text-primary underline"
      >
        {t("backToDashboard")}
      </Link>
    </main>
  );
}
