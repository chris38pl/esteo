import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function NewWorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);
  const t = await getTranslations("workspaces");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("new.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("new.subtitle")}</p>
      </div>

      <section className="surface-card mt-8 p-6">
        <CreateWorkspaceForm locale={resolvedLocale} mode="new" />
      </section>

      <Link
        href={`/${resolvedLocale}/dashboard`}
        className="mt-6 text-sm font-medium text-primary underline"
      >
        {t("new.backToDashboard")}
      </Link>
    </main>
  );
}
