import { ClientRedirect } from "@/components/routing/client-redirect";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { checkIncomingInvitationsAccess } from "@/server/workspaces/dashboard-route";

export default async function InvitationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  const { redirectTo } = await checkIncomingInvitationsAccess(resolvedLocale);

  if (redirectTo) {
    return <ClientRedirect href={redirectTo} />;
  }

  return children;
}
