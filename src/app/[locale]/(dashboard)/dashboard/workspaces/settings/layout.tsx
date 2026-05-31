import { assertWorkspaceSettingsAccess } from "@/server/workspaces/dashboard-route";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function WorkspaceSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  await assertWorkspaceSettingsAccess(resolvedLocale);

  return children;
}
