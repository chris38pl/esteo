import type { Metadata } from "next";

import type { Locale } from "@/lib/locale";
import { buildMarketingMetadata } from "@/features/marketing/seo/metadata";
import { getMarketingRoute, marketingPageSeo } from "@/features/marketing/seo/page-seo";
import type { MarketingRouteId } from "@/features/marketing/seo/site-config";
import { siteConfig } from "@/features/marketing/seo/site-config";

export function createMarketingPageMetadata(
  locale: Locale,
  routeId: MarketingRouteId,
): Metadata {
  const route = getMarketingRoute(routeId);
  const seo = marketingPageSeo[routeId][locale];

  return buildMarketingMetadata({
    locale,
    path: route.path,
    title: seo.title,
    description: seo.description,
    image: seo.ogImage ?? siteConfig.ogImage,
  });
}
