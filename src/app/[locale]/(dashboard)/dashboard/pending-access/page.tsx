import { SignOutButton } from "@clerk/nextjs";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function PendingAccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);
  const t = await getTranslations("workspaces");

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10">
      <section className="surface-card space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("pendingAccess.title")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("pendingAccess.description")}
        </p>
        <p className="text-xs text-muted-foreground">{t("pendingAccess.signOutHint")}</p>
        <SignOutButton redirectUrl={`/${resolvedLocale}/sign-in`}>
          <Button type="button" variant="outline" className="rounded-lg">
            {t("pendingAccess.signOut")}
          </Button>
        </SignOutButton>
      </section>
    </main>
  );
}
