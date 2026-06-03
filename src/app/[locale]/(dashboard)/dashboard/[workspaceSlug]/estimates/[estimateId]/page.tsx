import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";
import {
  getEstimateForEditor,
  getVersionWithTree,
} from "@/features/estimates/server/repository";
import { EstimateEditor } from "@/features/estimates/components/estimate-editor";
import {
  serializeEstimateForEditor,
  serializeVersionWithTree,
} from "@/features/estimates/lib/serialize-estimate";

export default async function EstimateEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; workspaceSlug: string; estimateId: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale, workspaceSlug, estimateId } = await params;
  const { v } = await searchParams;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  const estimate = await getEstimateForEditor(estimateId, resolved.workspace.id);

  if (!estimate) {
    redirect(`/${resolvedLocale}/dashboard/${workspaceSlug}/estimates`);
  }

  let activeVersionId = estimate.latestVersionId ?? estimate.versions[0]?.id;

  if (v) {
    const versionNumber = parseInt(v, 10);
    const found = estimate.versions.find((ver) => ver.versionNumber === versionNumber);
    if (found) {
      activeVersionId = found.id;
    }
  }

  const rawVersionTree = activeVersionId
    ? await getVersionWithTree(activeVersionId, resolved.workspace.id)
    : null;

  const serializedTree = rawVersionTree ? serializeVersionWithTree(rawVersionTree) : null;
  const editorKey = `${activeVersionId ?? "none"}-${serializedTree?.updatedAt ?? "empty"}`;

  return (
    <EstimateEditor
      key={editorKey}
      estimate={serializeEstimateForEditor(estimate)}
      versionTree={serializedTree}
      activeVersionId={activeVersionId ?? null}
      workspaceSlug={workspaceSlug}
      locale={resolvedLocale}
    />
  );
}
