"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { StorageExplorerFileList } from "@/features/admin-storage/components/storage-explorer-file-list";
import { StorageExplorerSummaryCards } from "@/features/admin-storage/components/storage-explorer-summary-cards";
import { StorageExplorerTree } from "@/features/admin-storage/components/storage-explorer-tree";
import { normalizeNodeId } from "@/features/admin-storage/lib/storage-explorer-node-ids";
import type {
  StorageExplorerItemClient,
  StorageExplorerSortKey,
  StorageExplorerSummary,
  StorageExplorerTreeNode,
} from "@/features/admin-storage/lib/storage-explorer-types";
import {
  getStorageExplorerSummaryAction,
  getStorageExplorerTreeAction,
  listStorageExplorerItemsAction,
  reconcileUploadThingAction,
} from "@/features/admin-storage/server/storage-explorer-actions";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/locale";
import { buildPaginatedResult, type PaginatedResult } from "@/lib/pagination";

const EMPTY_LIST: PaginatedResult<StorageExplorerItemClient> = buildPaginatedResult(
  [],
  0,
  { page: 1, pageSize: 20 },
);

export function AdminStorageExplorerPanel({
  locale,
  initialTree,
  initialSummary,
  initialNodeId,
  initialList,
}: {
  locale: Locale;
  initialTree: StorageExplorerTreeNode;
  initialSummary: StorageExplorerSummary;
  initialNodeId: string;
  initialList: PaginatedResult<StorageExplorerItemClient>;
}) {
  const t = useTranslations("admin.storageExplorer");
  const [tree, setTree] = useState(initialTree);
  const [summary, setSummary] = useState(initialSummary);
  const [selectedNodeId, setSelectedNodeId] = useState(normalizeNodeId(initialNodeId));
  const [listData, setListData] = useState(initialList);
  const [sort, setSort] = useState<StorageExplorerSortKey>("dateDesc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [listLoading, setListLoading] = useState(false);
  const [scanPending, startScanTransition] = useTransition();
  const [refreshPending, startRefreshTransition] = useTransition();

  const loadList = useCallback(
    async (input: {
      nodeId: string;
      page: number;
      pageSize: number;
      sort: StorageExplorerSortKey;
      search: string;
    }) => {
      setListLoading(true);
      const result = await listStorageExplorerItemsAction({
        locale,
        nodeId: input.nodeId,
        page: input.page,
        pageSize: input.pageSize,
        sort: input.sort,
        search: input.search,
      });
      setListLoading(false);

      if (result.success) {
        setListData(result.data);
      }
    },
    [locale],
  );

  useEffect(() => {
    void loadList({ nodeId: selectedNodeId, page, pageSize, sort, search });
  }, [selectedNodeId, page, pageSize, sort, search, loadList]);

  const refreshTreeAndSummary = useCallback(() => {
    startRefreshTransition(async () => {
      const [treeResult, summaryResult] = await Promise.all([
        getStorageExplorerTreeAction(locale),
        getStorageExplorerSummaryAction(locale),
      ]);

      if (treeResult.success) setTree(treeResult.data);
      if (summaryResult.success) setSummary(summaryResult.data);
    });
  }, [locale]);

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setPage(1);
  };

  const handleScanUploadThing = () => {
    startScanTransition(async () => {
      const result = await reconcileUploadThingAction(locale);
      if (result.success) {
        refreshTreeAndSummary();
        void loadList({ nodeId: selectedNodeId, page, pageSize, sort, search });
      }
    });
  };

  return (
    <div className="space-y-4">
      <StorageExplorerSummaryCards summary={summary} />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleScanUploadThing}
          disabled={scanPending}
        >
          {scanPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {t("scanUploadThing")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={refreshTreeAndSummary}
          disabled={refreshPending}
        >
          {refreshPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {t("refresh")}
        </Button>
        {summary.lastUtScanAt ? (
          <p className="text-xs text-muted-foreground">
            {t("lastScan", { date: new Date(summary.lastUtScanAt).toLocaleString() })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("scanHint")}</p>
        )}
      </div>

      <div className="grid min-h-[560px] gap-4 lg:grid-cols-[minmax(240px,300px)_1fr]">
        <div className="min-h-[280px] lg:min-h-0">
          <StorageExplorerTree
            tree={tree}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            currentEnvironment={summary.currentEnvironment}
          />
        </div>

        <div className="min-h-[360px] lg:min-h-0">
          <StorageExplorerFileList
            locale={locale}
            nodeId={selectedNodeId}
            data={listData ?? EMPTY_LIST}
            sort={sort}
            search={search}
            isLoading={listLoading}
            currentEnvironment={summary.currentEnvironment}
            onSortChange={(next) => {
              setSort(next);
              setPage(1);
            }}
            onSearchChange={(next) => {
              setSearch(next);
              setPage(1);
            }}
            onPageChange={setPage}
            onPageSizeChange={(next) => {
              setPageSize(next);
              setPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
