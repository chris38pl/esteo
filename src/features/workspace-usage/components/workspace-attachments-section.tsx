"use client";

import {
  Download,
  FileImage,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Paperclip,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import {
  deleteEstimateAttachmentAction,
  getAttachmentSignedUrlAction,
} from "@/features/attachments/server/attachments-actions";
import { downloadAttachmentFromUrl } from "@/features/attachments/lib/download-attachment";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
import type { EstimateAttachmentClient } from "@/features/attachments/lib/serialize-attachments";
import { deleteWorkspaceAttachmentsAction } from "@/features/workspace-usage/server/workspace-attachments-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type TypeFilter = "ALL" | EstimateAttachmentClient["attachmentType"];
type SortKey = "dateDesc" | "dateAsc" | "nameAsc" | "nameDesc" | "sizeDesc" | "sizeAsc";

const TYPE_STYLES: Record<
  EstimateAttachmentClient["attachmentType"],
  { bg: string; icon: string }
> = {
  PDF: { bg: "bg-red-500/10", icon: "text-red-500 dark:text-red-400" },
  DOCX: { bg: "bg-blue-500/10", icon: "text-blue-500 dark:text-blue-400" },
  IMAGE: { bg: "bg-violet-500/10", icon: "text-violet-500 dark:text-violet-400" },
};

function sortAttachments(items: EstimateAttachmentClient[], sortKey: SortKey) {
  const sorted = [...items];

  sorted.sort((a, b) => {
    switch (sortKey) {
      case "dateAsc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "nameAsc":
        return a.originalFileName.localeCompare(b.originalFileName, undefined, {
          sensitivity: "base",
        });
      case "nameDesc":
        return b.originalFileName.localeCompare(a.originalFileName, undefined, {
          sensitivity: "base",
        });
      case "sizeAsc":
        return Number(a.fileSizeBytes) - Number(b.fileSizeBytes);
      case "sizeDesc":
        return Number(b.fileSizeBytes) - Number(a.fileSizeBytes);
      case "dateDesc":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return sorted;
}

function FilterDropdown({
  label,
  valueLabel,
  children,
}: {
  label: string;
  valueLabel: string;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-border/60 bg-background/60 px-3 text-sm font-normal"
        >
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-foreground">{valueLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WorkspaceAttachmentsSection({
  workspaceId,
  workspaceSlug,
  initialAttachments,
}: {
  workspaceId: string;
  workspaceSlug: string;
  initialAttachments: EstimateAttachmentClient[];
}) {
  const t = useTranslations("workspaceUsage.attachments");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [attachments, setAttachments] = useState(initialAttachments);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("dateDesc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setAttachments(initialAttachments);
    setSelectedIds(new Set());
  }, [initialAttachments]);

  const filteredAttachments = useMemo(() => {
    const filtered =
      typeFilter === "ALL"
        ? attachments
        : attachments.filter((attachment) => attachment.attachmentType === typeFilter);

    return sortAttachments(filtered, sortKey);
  }, [attachments, sortKey, typeFilter]);

  const selectedCount = selectedIds.size;

  const toggleOne = useCallback((attachmentId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(attachmentId);
      } else {
        next.delete(attachmentId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadThumbnails() {
      const imageAttachments = attachments.filter(
        (attachment) => attachment.attachmentType === "IMAGE" && attachment.hasThumbnail,
      );

      const entries = await Promise.all(
        imageAttachments.map(async (attachment) => {
          const result = await getAttachmentSignedUrlAction({
            attachmentId: attachment.id,
            estimateId: attachment.estimateId,
            workspaceId,
            locale,
            variant: "thumbnail",
          });

          if (!result.success) {
            return null;
          }

          return [attachment.id, result.data.url] as const;
        }),
      );

      if (cancelled) {
        return;
      }

      const next: Record<string, string> = {};
      for (const entry of entries) {
        if (entry) {
          next[entry[0]] = entry[1];
        }
      }
      setPreviewUrls(next);
    }

    void loadThumbnails();

    return () => {
      cancelled = true;
    };
  }, [attachments, locale, workspaceId]);

  const pendingDeleteAttachments = useMemo(
    () => attachments.filter((attachment) => pendingDeleteIds.includes(attachment.id)),
    [attachments, pendingDeleteIds],
  );

  function openDeleteDialog(ids: string[]) {
    setPendingDeleteIds(ids);
    setDeleteDialogOpen(true);
  }

  function handleRefresh() {
    setIsRefreshing(true);
    router.refresh();
    window.setTimeout(() => setIsRefreshing(false), 600);
  }

  async function handleDownload(attachment: EstimateAttachmentClient) {
    setDownloadingId(attachment.id);
    setError(null);

    try {
      const result = await getAttachmentSignedUrlAction({
        attachmentId: attachment.id,
        estimateId: attachment.estimateId,
        workspaceId,
        locale,
        variant: "original",
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      await downloadAttachmentFromUrl(result.data.url, attachment.originalFileName);
    } catch {
      setError(t("downloadFailed"));
    } finally {
      setDownloadingId(null);
    }
  }

  function handleDeleteConfirmed() {
    setError(null);

    startTransition(async () => {
      const result =
        pendingDeleteIds.length === 1
          ? await deleteEstimateAttachmentAction({
              attachmentId: pendingDeleteIds[0]!,
              estimateId:
                attachments.find((item) => item.id === pendingDeleteIds[0])?.estimateId ?? "",
              workspaceId,
              workspaceSlug,
              locale,
            }).then((single) =>
              single.success ? { success: true as const, data: { deletedCount: 1 } } : single,
            )
          : await deleteWorkspaceAttachmentsAction({
              workspaceId,
              workspaceSlug,
              locale,
              attachmentIds: pendingDeleteIds,
            });

      if (!result.success) {
        setError(result.error);
        return;
      }

      const deleted = new Set(pendingDeleteIds);
      setAttachments((current) => current.filter((attachment) => !deleted.has(attachment.id)));
      setSelectedIds((current) => {
        const next = new Set(current);
        for (const id of pendingDeleteIds) {
          next.delete(id);
        }
        return next;
      });
      setDeleteDialogOpen(false);
      setPendingDeleteIds([]);
      router.refresh();
    });
  }

  function formatAttachmentMeta(attachment: EstimateAttachmentClient) {
    const date = formatDate(attachment.createdAt, locale, { dateStyle: "medium" });
    const size = formatBytes(Number(attachment.fileSizeBytes));
    return `${date} · ${size}`;
  }

  function renderFilePreview(attachment: EstimateAttachmentClient, compact = false) {
    const styles = TYPE_STYLES[attachment.attachmentType];
    const thumbnailUrl = previewUrls[attachment.id];
    const Icon = attachment.attachmentType === "IMAGE" ? FileImage : FileText;

    if (attachment.attachmentType === "IMAGE" && thumbnailUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          className={cn(
            "rounded-lg object-cover",
            compact ? "size-10" : "size-14 rounded-xl",
          )}
        />
      );
    }

    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl",
          compact ? "size-10" : "size-14",
          styles.bg,
        )}
      >
        <Icon className={cn(compact ? "size-5" : "size-7", styles.icon)} aria-hidden />
      </div>
    );
  }

  function renderTileActions(attachment: EstimateAttachmentClient) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-7 bg-card/90 text-muted-foreground shadow-xs hover:text-foreground"
            aria-label={t("fileActions")}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onSelect={() => {
              void handleDownload(attachment);
            }}
            disabled={downloadingId === attachment.id}
          >
            <Download className="size-4" />
            {t("download")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => openDeleteDialog([attachment.id])}
          >
            <Trash2 className="size-4" />
            {t("deleteFile")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/50 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
            <Paperclip className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            title={t("addFileHint")}
            className="h-9 gap-2 border-border/60 bg-background/60"
          >
            <Upload className="size-4" />
            {t("addFile")}
          </Button>

          <div className="flex overflow-hidden rounded-lg border border-border/60 bg-background/60 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={t("viewGrid")}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={t("viewList")}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown label={t("filters.type")} valueLabel={t(`types.${typeFilter}`)}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("filters.type")}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as TypeFilter)}
            >
              {(["ALL", "IMAGE", "PDF", "DOCX"] as const).map((type) => (
                <DropdownMenuRadioItem key={type} value={type}>
                  {t(`types.${type}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </FilterDropdown>

          <FilterDropdown label={t("filters.sort")} valueLabel={t(`sort.${sortKey}`)}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("filters.sort")}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sortKey}
              onValueChange={(value) => setSortKey(value as SortKey)}
            >
              {(
                [
                  "dateDesc",
                  "dateAsc",
                  "nameAsc",
                  "nameDesc",
                  "sizeDesc",
                  "sizeAsc",
                ] as const
              ).map((key) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {t(`sort.${key}`)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </FilterDropdown>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t("fileCount", { count: filteredAttachments.length })}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 text-muted-foreground"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label={t("refresh")}
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="border-b border-border/50 px-5 py-2">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      <div className="p-5">
        {filteredAttachments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
            {attachments.length === 0 ? t("empty") : t("emptyFiltered")}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredAttachments.map((attachment) => {
              const isSelected = selectedIds.has(attachment.id);

              return (
                <article
                  key={attachment.id}
                  className={cn(
                    "relative flex min-w-0 flex-col rounded-xl border bg-card p-4 transition-colors",
                    isSelected
                      ? "border-primary ring-1 ring-primary/25"
                      : "border-border/60 hover:border-border",
                  )}
                >
                  <div className="absolute top-3 left-3 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => toggleOne(attachment.id, checked === true)}
                      aria-label={t("selectFile", { fileName: attachment.originalFileName })}
                      className="border-border/80 bg-card shadow-xs"
                    />
                  </div>

                  <div className="absolute top-3 right-3 z-10">{renderTileActions(attachment)}</div>

                  <div className="mb-4 flex h-28 items-center justify-center rounded-lg bg-muted/25">
                    {renderFilePreview(attachment)}
                  </div>

                  <p
                    className="truncate text-center text-sm font-medium text-foreground"
                    title={attachment.originalFileName}
                  >
                    {attachment.originalFileName}
                  </p>
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    {formatAttachmentMeta(attachment)}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/25 text-left text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2.5" />
                  <th className="px-3 py-2.5 font-medium">{t("list.name")}</th>
                  <th className="hidden px-3 py-2.5 font-medium md:table-cell">{t("list.added")}</th>
                  <th className="px-3 py-2.5 font-medium">{t("list.size")}</th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filteredAttachments.map((attachment) => {
                  const isSelected = selectedIds.has(attachment.id);

                  return (
                    <tr
                      key={attachment.id}
                      className={cn(
                        "border-t border-border/40 transition-colors",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleOne(attachment.id, checked === true)
                          }
                          aria-label={t("selectFile", { fileName: attachment.originalFileName })}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {renderFilePreview(attachment, true)}
                          <span className="truncate font-medium">{attachment.originalFileName}</span>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">
                        {formatDate(attachment.createdAt, locale, { dateStyle: "medium" })}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-muted-foreground">
                        {formatBytes(Number(attachment.fileSizeBytes))}
                      </td>
                      <td className="px-3 py-3">{renderTileActions(attachment)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-muted/20 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background">
              {selectedCount}
            </span>
            <span className="text-sm font-medium text-foreground">{t("selectedFiles")}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => openDeleteDialog(Array.from(selectedIds))}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
              {t("deleteSelected")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
              {t("cancelSelection")}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={!isPending} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("delete.title")}</DialogTitle>
            <DialogDescription>
              {pendingDeleteIds.length === 1
                ? t("delete.descriptionSingle", {
                    fileName: pendingDeleteAttachments[0]?.originalFileName ?? "",
                  })
                : t("delete.descriptionMultiple", { count: pendingDeleteIds.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isPending}
            >
              {t("delete.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirmed}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
