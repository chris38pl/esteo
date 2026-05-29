import { assertNewWorkspaceAccess } from "@/server/workspaces/dashboard-route";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function NewWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  await assertNewWorkspaceAccess(resolvedLocale);

  return children;
}
