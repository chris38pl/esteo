import { permanentRedirect } from "next/navigation";

import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export default async function LegalIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "pl";

  permanentRedirect(buildLocalizedPath(locale, "/security"));
}
