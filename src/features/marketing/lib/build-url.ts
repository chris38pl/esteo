import type { Locale } from "@/lib/locale";

export function normalizeMarketingPath(path: string = "/"): string {
  if (!path || path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function buildLocalizedPath(locale: Locale, path: string = "/"): string {
  const hashIndex = path.indexOf("#");
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const normalizedPath = normalizeMarketingPath(pathWithoutHash || "/");

  if (normalizedPath === "/") {
    return `/${locale}${hash}`;
  }

  return `/${locale}${normalizedPath}${hash}`;
}
