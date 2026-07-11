"use client";

import {
  Copy,
  Download,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import type {
  StorageExplorerItemClient,
  StorageExplorerSortKey,
} from "@/features/admin-storage/lib/storage-explorer-types";
import { getAdminStorageSignedUrlAction } from "@/features/admin-storage/server/storage-explorer-actions";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import type { PaginatedResult } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const HEALTH_VARIANT: Record<
  StorageExplorerItemClient["healthStatus"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  ok: "secondary",
  staging_expired: "destructive",
  linked_duplicate: "outline",
  ut_orphan: "destructive",
  json_orphan: "destructive",
  legacy: "outline",
  duplicate_key: "destructive",
};

export function StorageExplorerFileList({
  locale,
  nodeId,
  data,
  sort,
  search,
  isLoading,
  onSortChange,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
}: {
  locale: Locale;
  nodeId: string;
  data: PaginatedResult<StorageExplorerItemClient>;
  sort: StorageExplorerSortKey;
  search: string;
  isLoading: boolean;
  onSortChange: (sort: StorageExplorerSortKey) => void;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const t = useTranslations("admin.storageExplorer.files");
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isContainerNode =
    nodeId === "all" ||
    nodeId === "workspaces" ||
    nodeId === "platform" ||
    nodeId === "orphans";

  const openSignedUrl = useCallback(
    (storageKey: string, download = false) => {
      startTransition(async () => {
        setDownloadingKey(storageKey);
        const result = await getAdminStorageSignedUrlAction({ locale, storageKey });
        setDownloadingKey(null);

        if (!result.success) return;

        if (download) {
          window.open(result.data.url, "_blank", "noopener,noreferrer");
        } else {
          window.open(result.data.url, "_blank", "noopener,noreferrer");
        }
      });
    },
    [locale],
  );

  const copyKey = useCallback(async (storageKey: string) => {
    try {
      await navigator.clipboard.writeText(storageKey);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-9 pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-9">
              {t(`sort.${sort}`)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("sortLabel")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) => onSortChange(value as StorageExplorerSortKey)}
            >
              {(
                [
                  "dateDesc",
                  "dateAsc",
                  "nameAsc",
                  "nameDesc",
                  "sizeDesc",
                  "sizeAsc",
                ] as StorageExplorerSortKey[]
              ).map((key) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {t(`sort.${key}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className={cn(
          "relative min-h-0 flex-1 overflow-auto rounded-lg border border-border/60",
          isLoading && "opacity-60",
        )}
      >
        {isContainerNode ? (
          <div className="flex h-40 items-center justify-center p-6 text-sm text-muted-foreground">
            {t("selectLeaf")}
          </div>
        ) : data.totalCount === 0 ? (
          <div className="flex h-40 items-center justify-center p-6 text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.name")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("columns.type")}</TableHead>
                <TableHead>{t("columns.size")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("columns.date")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => {
                const busy = isPending && downloadingKey === item.storageKey;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-[220px]">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.originalFileName}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {item.storageKey}
                        </p>
                        {item.workspaceName ? (
                          <p className="truncate text-[10px] text-muted-foreground">
                            {item.workspaceName}
                            {item.estimateTitle ? ` · ${item.estimateTitle}` : ""}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {item.dbSource}
                        {item.isThumbnail ? " (thumb)" : ""}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {item.fileSizeBytes ? formatBytes(BigInt(item.fileSizeBytes)) : "-"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {formatDate(new Date(item.createdAt), locale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={HEALTH_VARIANT[item.healthStatus]}>
                        {t(`health.${item.healthStatus}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="size-8">
                            {busy ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="size-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openSignedUrl(item.storageKey)}>
                            <ExternalLink className="size-4" />
                            {t("actions.open")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSignedUrl(item.storageKey, true)}>
                            <Download className="size-4" />
                            {t("actions.download")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyKey(item.storageKey)}>
                            <Copy className="size-4" />
                            {t("actions.copyKey")}
                          </DropdownMenuItem>
                          {item.contextHref ? (
                            <DropdownMenuItem asChild>
                              <Link href={item.contextHref}>{t("actions.openContext")}</Link>
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <PaginationControls
        page={data.page}
        pageSize={data.pageSize}
        totalCount={data.totalCount}
        totalPages={data.totalPages}
        hasPreviousPage={data.hasPreviousPage}
        hasNextPage={data.hasNextPage}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[10, 20, 50]}
        isLoading={isLoading}
      />
    </div>
  );
}
