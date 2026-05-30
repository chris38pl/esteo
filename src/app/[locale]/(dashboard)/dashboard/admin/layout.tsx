import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function DashboardAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  await assertPlatformAdminAccess(resolvedLocale);

  return children;
}
