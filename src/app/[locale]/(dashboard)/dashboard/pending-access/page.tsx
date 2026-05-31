import { redirect } from "next/navigation";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { incomingInvitationsPath } from "@/server/workspaces/dashboard-route";

export default async function PendingAccessRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  redirect(incomingInvitationsPath(resolvedLocale));
}
