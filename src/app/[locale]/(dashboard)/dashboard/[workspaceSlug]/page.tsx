import { setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  // Intentionally minimal — main dashboard panels are added incrementally.
  return <div className="min-h-[12rem]" />;
}
