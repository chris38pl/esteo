import { getTranslations, setRequestLocale } from "next-intl/server";

import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);
  const t = await getTranslations("workspaces");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("onboarding.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>
      </div>

      <section className="surface-card mt-8 p-6">
        <CreateWorkspaceForm locale={resolvedLocale} />
      </section>
    </main>
  );
}
