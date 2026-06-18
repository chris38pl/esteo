import { publicEstimateRequestSegmentByLocale } from "@/features/estimate-requests/routes";
import type { Locale } from "@/lib/locale";
import { locales, setLocalePreferenceCookie } from "@/lib/locale";

export function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  const current = segments[1];
  if (locales.includes(current as Locale)) {
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  }
  return `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

export function withLocaleSpecificSegments(pathname: string, nextLocale: Locale): string {
  const withPrefix = withLocale(pathname, nextLocale);
  const segments = withPrefix.split("/");

  const locale = segments[1];
  const segment = segments[2];
  const workspaceSlug = segments[3];

  if (!workspaceSlug || locale !== nextLocale) {
    return withPrefix;
  }

  const estimateSegments = Object.values(publicEstimateRequestSegmentByLocale);
  if (estimateSegments.includes(segment)) {
    segments[2] = publicEstimateRequestSegmentByLocale[nextLocale];
    return segments.join("/");
  }

  return withPrefix;
}

export function buildLocalePath(
  pathname: string,
  nextLocale: Locale,
  searchParams?: string | null,
): string {
  const nextBase = pathname ? withLocaleSpecificSegments(pathname, nextLocale) : `/${nextLocale}`;
  const query = searchParams?.trim();
  return query ? `${nextBase}?${query}` : nextBase;
}

export function switchAppLocale(
  pathname: string,
  currentLocale: Locale,
  nextLocale: Locale,
  searchParams?: string | null,
): string | null {
  if (nextLocale === currentLocale) {
    return null;
  }

  setLocalePreferenceCookie(nextLocale);
  return buildLocalePath(pathname, nextLocale, searchParams);
}
