import type { Locale } from "@/lib/locale";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import { siteConfig, type MarketingRoute } from "@/features/marketing/seo/site-config";

export type MarketingNavigationItem = {
  id: MarketingRoute["id"];
  label: string;
  href: string;
  implemented: boolean;
};

function toNavigationItem(route: MarketingRoute, locale: Locale): MarketingNavigationItem {
  return {
    id: route.id,
    label: route.label[locale],
    href: buildLocalizedPath(locale, route.path),
    implemented: route.implemented,
  };
}

export function getMarketingHeaderNavigation(locale: Locale): MarketingNavigationItem[] {
  return siteConfig.launchRoutes
    .filter((route) => route.nav.header)
    .map((route) => toNavigationItem(route, locale));
}

export function getMarketingFooterNavigation(locale: Locale): MarketingNavigationItem[] {
  return siteConfig.launchRoutes
    .filter((route) => route.nav.footer && !route.nav.legal)
    .map((route) => toNavigationItem(route, locale));
}

export function getMarketingLegalNavigation(locale: Locale): MarketingNavigationItem[] {
  return siteConfig.launchRoutes
    .filter((route) => route.nav.legal)
    .map((route) => toNavigationItem(route, locale));
}
