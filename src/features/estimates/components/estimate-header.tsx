"use client";

import { useTranslations } from "next-intl";
import type { EstimateVersionStatus } from "@prisma/client";
import { ChevronDown, Ellipsis, Eye, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  estimateHeaderActionsDividerClassName,
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "./estimate-action-button-styles";
import { EstimateVersionSelector } from "./estimate-version-selector";
import { EstimateHeaderStatusBadge } from "./estimate-header-status-badge";
import { EstimateRulesIndicator } from "./estimate-rules-indicator";
import { EstimateHeaderPinMenuItem } from "./estimate-header-pin-menu-item";
import { EstimateHeaderRenameMenuItem } from "./estimate-header-rename-menu-item";
import { EstimateHeaderVersionMenuItems } from "./estimate-header-version-menu-items";
import { EstimateHeaderRetryAiMenuItem } from "./estimate-header-retry-ai-menu-item";
import { EstimateHeaderPdfExportMenuItem } from "./estimate-header-pdf-export-menu-item";
import type { AutoSaveStatus } from "@/features/estimates/hooks/use-estimate-autosave";
import type { Locale } from "@/lib/locale";
import {
  estimateHeaderClass,
  estimateHeaderDesktopActionsClass,
  estimateHeaderInlineActionButtonClass,
  estimateHeaderInlineActionMenuItemClass,
  estimateHeaderMobileMetaClass,
  estimateHeaderPrimaryClass,
  estimateHeaderSendActionClass,
  estimateHeaderTitleClass,
} from "@/features/estimates/lib/estimate-header-layout";
import { cn } from "@/lib/utils";

const headerInlineActionButtonClassName = cn(
  estimateOutlineButtonClassName,
  estimateHeaderInlineActionButtonClass,
);

const headerMoreMenuInlineActionClassName = cn(
  "gap-2",
  estimateHeaderInlineActionMenuItemClass,
);

interface Version {
  id: string;
  versionNumber: number;
  status: EstimateVersionStatus;
}

interface EstimateHeaderProps {
  title?: string | null;
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  versions: Version[];
  activeVersionId: string;
  autosaveStatus: AutoSaveStatus;
  rulesApplied?: boolean;
  isPinned?: boolean;
  canManualRetryAiDraft?: boolean;
  onBeforePdfExport?: () => Promise<boolean>;
  onPreviewPdf?: () => void;
  isPreviewLoading?: boolean;
}

interface EstimateHeaderMoreMenuProps {
  title?: string | null;
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  activeVersionId: string;
  activeStatus: EstimateVersionStatus;
  versions: Version[];
  isPinned: boolean;
  canManualRetryAiDraft?: boolean;
  onBeforePdfExport?: () => Promise<boolean>;
  onPreviewPdf?: () => void;
  isPreviewLoading?: boolean;
  trigger: React.ReactNode;
}

function EstimateHeaderMoreMenu({
  title,
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  activeVersionId,
  activeStatus,
  versions,
  isPinned,
  canManualRetryAiDraft = false,
  onBeforePdfExport,
  onPreviewPdf,
  isPreviewLoading = false,
  trigger,
}: EstimateHeaderMoreMenuProps) {
  const t = useTranslations("estimates");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EstimateHeaderRenameMenuItem
          title={title}
          estimateId={estimateId}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          locale={locale}
        />
        <EstimateHeaderPinMenuItem
          estimateId={estimateId}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          locale={locale}
          isPinned={isPinned}
        />
        <EstimateHeaderVersionMenuItems
          estimateId={estimateId}
          activeVersionId={activeVersionId}
          activeVersionStatus={activeStatus}
          versionCount={versions.length}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          locale={locale}
        />
        {canManualRetryAiDraft ? (
          <EstimateHeaderRetryAiMenuItem
            estimateId={estimateId}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            locale={locale}
          />
        ) : null}
        <EstimateHeaderPdfExportMenuItem
          estimateId={estimateId}
          versionId={activeVersionId}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          locale={locale}
          onBeforeExport={onBeforePdfExport}
        />
        <DropdownMenuItem
          className={headerMoreMenuInlineActionClassName}
          disabled={!onPreviewPdf || isPreviewLoading}
          onSelect={() => {
            onPreviewPdf?.();
          }}
        >
          <Eye className="size-4" />
          {t("header.actions.preview")}
        </DropdownMenuItem>
        <DropdownMenuItem className={headerMoreMenuInlineActionClassName}>
          <Share2 className="size-4" />
          {t("header.actions.share")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function EstimateHeader({
  title,
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  versions,
  activeVersionId,
  autosaveStatus,
  rulesApplied = true,
  isPinned = false,
  canManualRetryAiDraft = false,
  onBeforePdfExport,
  onPreviewPdf,
  isPreviewLoading = false,
}: EstimateHeaderProps) {
  const t = useTranslations("estimates");
  const activeVersion = versions.find((version) => version.id === activeVersionId) ?? versions[0];
  const activeVersionNumber = activeVersion?.versionNumber ?? 1;
  const activeStatus = activeVersion?.status ?? "DRAFT";
  const headerTitle = title ?? t("editor.titleEyebrow");

  const statusBadge = (
    <EstimateHeaderStatusBadge
      versionStatus={activeStatus}
      autosaveStatus={autosaveStatus}
    />
  );

  const moreMenuProps = {
    title,
    estimateId,
    workspaceId,
    workspaceSlug,
    locale,
    activeVersionId,
    activeStatus,
    versions,
    isPinned,
    canManualRetryAiDraft,
    onBeforePdfExport,
    onPreviewPdf,
    isPreviewLoading,
  };

  return (
    <header className={estimateHeaderClass}>
      <div className={estimateHeaderPrimaryClass}>
        <h1 className={estimateHeaderTitleClass}>
          {t("editor.titleWithVersion", {
            title: headerTitle,
            version: activeVersionNumber,
          })}
        </h1>
        <div className="estimate-header__status-desktop">{statusBadge}</div>
      </div>

      <div className={estimateHeaderMobileMetaClass}>
        {statusBadge}
        <EstimateVersionSelector
          estimateId={estimateId}
          workspaceId={workspaceId}
          versions={versions}
          activeVersionId={activeVersionId}
          locale={locale}
          workspaceSlug={workspaceSlug}
        />
        <EstimateRulesIndicator
          workspaceSlug={workspaceSlug}
          locale={locale}
          rulesApplied={rulesApplied}
        />
        <EstimateHeaderMoreMenu
          {...moreMenuProps}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={estimateOutlineButtonClassName}
              aria-label={t("header.actions.more")}
            >
              <Ellipsis className="size-4" />
            </Button>
          }
        />
      </div>

      <div className={estimateHeaderDesktopActionsClass}>
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={headerInlineActionButtonClassName}
            disabled={!onPreviewPdf || isPreviewLoading}
            onClick={() => onPreviewPdf?.()}
          >
            <Eye className="size-4" />
            {t("header.actions.preview")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={headerInlineActionButtonClassName}
          >
            <Share2 className="size-4" />
            {t("header.actions.share")}
          </Button>
          <Button
            type="button"
            size="sm"
            className={cn(estimatePrimaryButtonClassName, estimateHeaderSendActionClass)}
          >
            {t("header.actions.send")}
          </Button>
          <EstimateHeaderMoreMenu
            {...moreMenuProps}
            trigger={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={estimateOutlineButtonClassName}
              >
                {t("header.actions.more")}
                <ChevronDown className="size-4" />
              </Button>
            }
          />
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          className={estimateHeaderActionsDividerClassName}
        />

        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <EstimateRulesIndicator
            workspaceSlug={workspaceSlug}
            locale={locale}
            rulesApplied={rulesApplied}
          />

          <EstimateVersionSelector
            estimateId={estimateId}
            workspaceId={workspaceId}
            versions={versions}
            activeVersionId={activeVersionId}
            locale={locale}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </div>
    </header>
  );
}
