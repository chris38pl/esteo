"use client";

import { useState } from "react";
import { Clock, Layers, LayoutGrid, Loader2, MoreHorizontal, Pencil, Star, StarOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { appToast } from "@/components/ui/app-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EstimateTemplateMetadataDialog } from "@/features/estimate-templates/components/estimate-template-metadata-dialog";
import type { TemplateAutoSaveStatus } from "@/features/estimate-templates/hooks/use-template-autosave";
import { templateDefaultBadgeColors } from "@/features/estimate-templates/lib/template-ui-styles";
import {
  deleteEstimateTemplateAction,
  setDefaultEstimateTemplateAction,
} from "@/features/workspace-configuration/server/actions";
import { formatDate } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface EstimateTemplateDetailHeaderProps {
  name: string;
  description: string;
  isDefault: boolean;
  isNew: boolean;
  autosaveStatus: TemplateAutoSaveStatus;
  pendingAiSave?: boolean;
  onSaveTemplate?: () => void | Promise<void>;
  isSavingTemplate?: boolean;
  readOnly: boolean;
  locale: Locale;
  workspaceId: string;
  workspaceSlug: string;
  templateId: string | null;
  updatedAt: string | null;
  sectionCount: number;
  itemCount: number;
  onMetadataSave: (payload: { name: string; description: string }) => void | Promise<void>;
  isKpiLoading?: boolean;
}

const templateControlButtonClass = "h-10 rounded-md px-4";
const kpiCellClass = "flex items-center gap-5 py-4 pr-4 pl-6";
const kpiValueClass = "min-h-8 text-2xl font-semibold tabular-nums leading-8";
const kpiUpdatedValueClass = "min-h-8 text-lg font-semibold tabular-nums leading-8";

function TemplateKpiSkeletonCell() {
  return (
    <div className={kpiCellClass} aria-hidden>
      <div className="size-5 shrink-0 animate-pulse rounded-md bg-foreground/10 dark:bg-muted" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-foreground/10 dark:bg-muted" />
        <div className="h-8 w-12 animate-pulse rounded bg-foreground/10 dark:bg-muted/60" />
      </div>
    </div>
  );
}

function TemplateMetadataSkeleton() {
  return (
    <div className="min-w-0 flex-1" aria-hidden>
      <div className="min-h-8">
        <div className="h-8 w-56 max-w-full animate-pulse rounded bg-foreground/10 dark:bg-muted" />
      </div>
      <div className="mt-2 min-h-5">
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-foreground/10 dark:bg-muted/60" />
      </div>
    </div>
  );
}

function statusBadgeClass(status: TemplateAutoSaveStatus): string {
  switch (status) {
    case "saving":
      return "text-muted-foreground";
    case "saved":
      return "text-emerald-600 dark:text-emerald-400";
    case "error":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
}

export function EstimateTemplateDetailHeader({
  name,
  description,
  isDefault,
  isNew,
  autosaveStatus,
  pendingAiSave = false,
  onSaveTemplate,
  isSavingTemplate = false,
  readOnly,
  locale,
  workspaceId,
  workspaceSlug,
  templateId,
  updatedAt,
  sectionCount,
  itemCount,
  onMetadataSave,
  isKpiLoading = false,
}: EstimateTemplateDetailHeaderProps) {
  const t = useTranslations("workspaces.configuration.templates");
  const tEditor = useTranslations("workspaces.configuration.templates.editor");
  const tToast = useTranslations("workspaces.configuration.templates.toast");
  const tWorkspace = useTranslations("workspaces.configuration.templates.workspace");
  const router = useRouter();
  const [metadataOpen, setMetadataOpen] = useState(false);

  const statusLabel = pendingAiSave
    ? tEditor("unsavedAiDraft")
    : autosaveStatus === "saving"
      ? tEditor("saving")
      : autosaveStatus === "saved"
        ? tEditor("saved")
        : autosaveStatus === "error"
          ? tEditor("saveError")
          : tEditor("autosaveIdle");

  const formattedUpdatedAt =
    updatedAt &&
    formatDate(updatedAt, locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  async function handleMetadataSave(payload: { name: string; description: string }) {
    await onMetadataSave(payload);
  }

  const autosaveBadge = (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border-border/60 px-3 text-sm font-medium",
        statusBadgeClass(autosaveStatus),
      )}
    >
      {autosaveStatus === "saving" ? <Loader2 className="size-4 shrink-0 animate-spin" /> : null}
      <span className="whitespace-nowrap">{statusLabel}</span>
    </Badge>
  );

  const saveTemplateButton =
    pendingAiSave && onSaveTemplate ? (
      <Button
        type="button"
        className={cn(templateControlButtonClass, "gap-2")}
        disabled={readOnly || isSavingTemplate}
        onClick={() => void onSaveTemplate()}
      >
        {isSavingTemplate ? <Loader2 className="size-4 animate-spin" /> : null}
        {tEditor("saveTemplate")}
      </Button>
    ) : null;

  const editButton = (
    <Button
      type="button"
      variant="outline"
      className={cn(templateControlButtonClass, "gap-2")}
      disabled={readOnly}
      onClick={() => setMetadataOpen(true)}
    >
      <Pencil className="size-4" />
      {t("edit")}
    </Button>
  );

  const menuButton =
    !isNew && templateId ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-md"
            disabled={readOnly}
            aria-label={tWorkspace("detailMenuLabel")}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isDefault ? (
            <DropdownMenuItem
              className="gap-2"
              onClick={async () => {
                const result = await setDefaultEstimateTemplateAction(
                  {
                    workspaceId,
                    workspaceSlug,
                    templateId: null,
                    revalidateTemplateId: templateId,
                  },
                  locale,
                );
                if (!result.success) appToast.error(result.error);
                else appToast.success(tToast("defaultCleared"));
                router.refresh();
              }}
            >
              <StarOff className="size-4" />
              {t("clearDefault")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="gap-2"
              onClick={async () => {
                const result = await setDefaultEstimateTemplateAction(
                  { workspaceId, workspaceSlug, templateId },
                  locale,
                );
                if (!result.success) appToast.error(result.error);
                else appToast.success(tToast("defaultSet"));
                router.refresh();
              }}
            >
              <Star className="size-4" />
              {t("setDefault")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            className="gap-2"
            onClick={async () => {
              const result = await deleteEstimateTemplateAction(
                { workspaceId, workspaceSlug, templateId },
                locale,
              );
              if (!result.success) {
                appToast.error(result.error);
                return;
              }
              appToast.success(tToast("deleted"));
              router.push(`/${locale}/dashboard/${workspaceSlug}/configuration?tab=templates`);
            }}
          >
            <Trash2 className="size-4" />
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {isKpiLoading ? (
            <TemplateMetadataSkeleton />
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="min-h-8 truncate text-2xl font-semibold leading-8 tracking-tight text-foreground">
                  {name.trim() || tEditor("namePlaceholder")}
                </h1>
                {isDefault ? (
                  <Badge
                    className={cn(
                      "inline-flex h-10 items-center rounded-md px-3 text-[10px] font-semibold uppercase tracking-wide",
                      templateDefaultBadgeColors,
                    )}
                  >
                    {t("defaultBadge")}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 min-h-5 text-sm leading-relaxed text-muted-foreground">
                {description.trim() || tWorkspace("noDescription")}
              </p>
            </div>
          )}

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {autosaveBadge}
            {saveTemplateButton}
            {editButton}
            {menuButton}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:hidden">
          {autosaveBadge}
          <div className="flex shrink-0 items-center gap-2">
            {saveTemplateButton}
            {editButton}
            {menuButton}
          </div>
        </div>

        <div className="mt-6 mb-6 overflow-hidden rounded-lg border border-border/70">
          <div className="grid divide-y divide-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {isKpiLoading ? (
              <>
                <TemplateKpiSkeletonCell />
                <TemplateKpiSkeletonCell />
                <TemplateKpiSkeletonCell />
              </>
            ) : (
              <>
                <div className={kpiCellClass}>
                  <Layers className="size-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{tWorkspace("kpiSections")}</p>
                    <p className={kpiValueClass}>{sectionCount}</p>
                  </div>
                </div>
                <div className={kpiCellClass}>
                  <LayoutGrid className="size-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{tWorkspace("kpiItems")}</p>
                    <p className={kpiValueClass}>{itemCount}</p>
                  </div>
                </div>
                <div className={kpiCellClass}>
                  <Clock className="size-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{tWorkspace("kpiUpdated")}</p>
                    <p className={kpiUpdatedValueClass}>{formattedUpdatedAt ?? "—"}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <EstimateTemplateMetadataDialog
        open={metadataOpen}
        onOpenChange={setMetadataOpen}
        initialName={name}
        initialDescription={description}
        readOnly={readOnly}
        onSave={handleMetadataSave}
      />
    </>
  );
}

export function EstimateTemplateDefaultNotice() {
  const tWorkspace = useTranslations("workspaces.configuration.templates.workspace");

  return (
    <div className="flex gap-3 rounded-md border border-border/60 bg-muted/25 p-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        i
      </span>
      <p className="text-sm leading-relaxed text-muted-foreground">{tWorkspace("defaultNotice")}</p>
    </div>
  );
}
