import { ClientRedirect } from "@/components/routing/client-redirect";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function PendingAccessRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  return <ClientRedirect href={`/${resolvedLocale}/dashboard/invitations`} />;
}
