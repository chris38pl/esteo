import { ClientRedirect } from "@/components/routing/client-redirect";
import { checkWorkspaceSettingsAccess } from "@/server/workspaces/dashboard-route";
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

  const { redirectTo } = await checkWorkspaceSettingsAccess(resolvedLocale);

  if (redirectTo) {
    return <ClientRedirect href={redirectTo} />;
  }

  return children;
}
