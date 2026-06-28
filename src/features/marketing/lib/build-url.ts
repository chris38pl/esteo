import type { Locale } from "@/lib/locale";

export function normalizeMarketingPath(path: string = "/"): string {
  if (!path || path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function buildLocalizedPath(locale: Locale, path: string = "/"): string {
  const normalizedPath = normalizeMarketingPath(path);

  if (normalizedPath === "/") {
    return `/${locale}`;
  }

  return `/${locale}${normalizedPath}`;
}
