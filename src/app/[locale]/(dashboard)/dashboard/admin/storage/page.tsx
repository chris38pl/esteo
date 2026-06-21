import { setRequestLocale } from "next-intl/server";

import { AdminStorageExplorerPanel } from "@/features/admin-storage/components/admin-storage-explorer-panel";
import { normalizeNodeId, parseNodeId } from "@/features/admin-storage/lib/storage-explorer-node-ids";
import {
  getStorageExplorerSummary,
  getStorageExplorerTree,
  listStorageExplorerItems,
} from "@/features/admin-storage/server/storage-explorer-repository";
import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { buildPaginatedResult } from "@/lib/pagination";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

export default async function AdminStorageExplorerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ node?: string }>;
}) {
  const { locale: localeParam } = await params;
  const query = await searchParams;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  await assertPlatformAdminAccess(resolvedLocale);
  const t = await getServerTranslations(resolvedLocale, "admin");

  const nodeId = normalizeNodeId(query.node ?? "workspaces");
  const parsedNode = parseNodeId(nodeId);

  const [tree, summary, initialList] = await Promise.all([
    getStorageExplorerTree(),
    getStorageExplorerSummary(),
    parsedNode &&
    parsedNode.kind !== "all" &&
    parsedNode.kind !== "workspaces" &&
    parsedNode.kind !== "platform" &&
    parsedNode.kind !== "orphans"
      ? listStorageExplorerItems({
          node: parsedNode,
          locale: resolvedLocale,
          pagination: { page: 1, pageSize: 20 },
          sort: "dateDesc",
          search: "",
        })
      : Promise.resolve(buildPaginatedResult([], 0, { page: 1, pageSize: 20 })),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("storageExplorer.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("storageExplorer.subtitle")}</p>
      </div>

      <AdminStorageExplorerPanel
        locale={resolvedLocale}
        initialTree={tree}
        initialSummary={summary}
        initialNodeId={nodeId}
        initialList={initialList}
      />
    </div>
  );
}
