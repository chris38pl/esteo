import type { Locale } from "@/lib/locale";
import { buildBreadcrumbJsonLd } from "@/features/marketing/seo/json-ld";

export function TrustBreadcrumbJsonLd({
  locale,
  items,
}: {
  locale: Locale;
  items: Array<{ name: string; path: string }>;
}) {
  const jsonLd = buildBreadcrumbJsonLd(locale, items);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
