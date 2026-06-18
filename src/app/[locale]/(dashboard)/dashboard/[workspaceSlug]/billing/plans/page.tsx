import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { dashboardBillingManageHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function WorkspaceBillingPlansRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
  searchParams: Promise<{ plan?: string; checkout?: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const query = await searchParams;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const target = new URL(
    dashboardBillingManageHref(resolvedLocale, workspaceSlug),
    "http://localhost",
  );
  if (query.plan) {
    target.searchParams.set("plan", query.plan);
  }
  if (query.checkout) {
    target.searchParams.set("checkout", query.checkout);
  }

  redirect(`${target.pathname}${target.search}`);
}
