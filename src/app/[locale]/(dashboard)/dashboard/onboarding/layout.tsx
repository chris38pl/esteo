import { ClientRedirect } from "@/components/routing/client-redirect";
import { checkOnboardingAccess } from "@/server/workspaces/dashboard-route";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  const { redirectTo } = await checkOnboardingAccess(resolvedLocale);

  if (redirectTo) {
    return <ClientRedirect href={redirectTo} />;
  }

  return children;
}
