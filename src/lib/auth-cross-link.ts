export function authCrossLinkPath(
  locale: string,
  target: "sign-in" | "sign-up",
  queryString?: string | null,
): string {
  const trimmed = queryString?.replace(/^\?/, "").trim();
  return trimmed ? `/${locale}/${target}?${trimmed}` : `/${locale}/${target}`;
}

export function searchParamsToQueryString(
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
    }
  }
  return params.toString();
}
