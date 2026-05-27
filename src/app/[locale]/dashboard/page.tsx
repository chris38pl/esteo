import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { requireAuth } from "@/server/auth/require-auth";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const user = await requireAuth();

  return (
    <main className="flex-1">
      <DashboardFrame
        sidebar={
          <div className="space-y-2 text-sm">
            <p className="font-semibold">{t("sidebar.title")}</p>
            <p className="rounded-md bg-sidebar-accent px-3 py-2">
              {t("sidebar.dashboard")}
            </p>
            <p className="rounded-md px-3 py-2 text-muted-foreground">
              {t("sidebar.requests")}
            </p>
            <p className="rounded-md px-3 py-2 text-muted-foreground">
              {t("sidebar.estimates")}
            </p>
          </div>
        }
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <UserButton />
        </div>

        <section className="surface-card w-full max-w-xl space-y-2 p-6">
          <p className="text-sm text-muted-foreground">{t("fields.userId")}</p>
          <p className="font-mono text-sm">{user.id}</p>
          <p className="text-sm text-muted-foreground">{t("fields.email")}</p>
          <p className="text-sm">{user.email}</p>
          <p className="text-sm text-muted-foreground">{t("fields.clerkId")}</p>
          <p className="font-mono text-sm">{user.clerkId}</p>
        </section>

        <Link
          href={`/${locale}`}
          className="text-sm font-medium text-primary underline"
        >
          {t("actions.backHome")}
        </Link>
      </DashboardFrame>
    </main>
  );
}
