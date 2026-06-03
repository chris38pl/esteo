import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/locale";

export function revalidateEstimatePaths(
  locale: Locale,
  workspaceSlug: string,
  estimateId: string,
): void {
  const base = `/${locale}/dashboard/${workspaceSlug}`;
  revalidatePath(`${base}/estimates/${estimateId}`);
  revalidatePath(`${base}/estimates`);
}
