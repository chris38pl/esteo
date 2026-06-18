import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { dashboardBillingManageHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function WorkspaceBillingAddonsRedirectPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  redirect(dashboardBillingManageHref(resolvedLocale, workspaceSlug));
}
