import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { assertIncomingInvitationsAccess } from "@/server/workspaces/dashboard-route";

export default async function InvitationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  await assertIncomingInvitationsAccess(resolvedLocale);

  return children;
}
