import { redirect } from "next/navigation";

import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { dashboardBillingPlansHref } from "@/lib/dashboard-routes";

export default async function WorkspaceUpgradePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
  searchParams: Promise<{ plan?: string; checkout?: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const { plan, checkout } = await searchParams;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  const target = dashboardBillingPlansHref(resolvedLocale, workspaceSlug);
  const queryParams = new URLSearchParams();
  if (plan) {
    queryParams.set("plan", plan);
  }
  if (checkout) {
    queryParams.set("checkout", checkout);
  }
  const query = queryParams.toString();

  redirect(query ? `${target}?${query}` : target);
}
