import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";
import type { Locale } from "@/lib/locale";

export async function copyPublicFormLink(
  locale: Locale,
  workspaceSlug: string,
  copyFallbackLabel: string,
): Promise<boolean> {
  const path = getPublicEstimateRequestPath(locale, workspaceSlug);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}${path}`
      : path;

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    window.prompt(copyFallbackLabel, url);
    return false;
  }
}
