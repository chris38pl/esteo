import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { requireAuth } from "@/server/auth/require-auth";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const user = await requireAuth(locale);

  return (
    <main className="flex-1">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <UserButton />
      </div>

      <section className="surface-card mt-6 w-full max-w-xl space-y-2 p-6">
        <p className="text-sm text-muted-foreground">{t("fields.userId")}</p>
        <p className="font-mono text-sm">{user.id}</p>
        <p className="text-sm text-muted-foreground">{t("fields.email")}</p>
        <p className="text-sm">{user.email}</p>
        <p className="text-sm text-muted-foreground">{t("fields.clerkId")}</p>
        <p className="font-mono text-sm">{user.clerkId}</p>
      </section>

      <Link
        href={`/${locale}`}
        className="mt-6 inline-flex text-sm font-medium text-primary underline"
      >
        {t("actions.backHome")}
      </Link>
    </main>
  );
}

