import { setRequestLocale } from "next-intl/server";

import { CreateWorkspacePanel } from "@/features/workspaces/components/create-workspace-panel";
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

  return (
    <CreateWorkspacePanel locale={resolvedLocale} mode="new" layout="embedded" />
  );
}
