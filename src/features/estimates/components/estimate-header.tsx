"use client";

import { useTranslations } from "next-intl";
import type { EstimateVersionStatus } from "@prisma/client";
import { ChevronDown, Ellipsis, Eye } from "lucide-react";

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
  estimateOutlineIconButtonClassName,
} from "./estimate-action-button-styles";
import { EstimateVersionSelector } from "./estimate-version-selector";
import { EstimateHeaderStatusBadge } from "./estimate-header-status-badge";
import { EstimateHeaderWorkflowActions } from "./estimate-header-workflow-actions";
import type { EstimateSendDialogMode } from "./estimate-send-dialog";
import { EstimateRulesIndicator } from "./estimate-rules-indicator";
import { EstimateHeaderPinMenuItem } from "./estimate-header-pin-menu-item";
import { EstimateHeaderRenameMenuItem } from "./estimate-header-rename-menu-item";
import { EstimateHeaderVersionMenuItems } from "./estimate-header-version-menu-items";
import { EstimateHeaderRetryAiMenuItem } from "./estimate-header-retry-ai-menu-item";
import { EstimateHeaderPdfExportMenuItem } from "./estimate-header-pdf-export-menu-item";
import type { EstimatePdfBeforeExportResult } from "@/features/estimates/hooks/use-estimate-pdf-output";
import type { AutoSaveStatus } from "@/features/estimates/hooks/use-estimate-autosave";
import type { EstimateVersionWorkflowClient } from "@/features/estimates/lib/serialize-estimate-version-workflow";
import type { Locale } from "@/lib/locale";
import {
  estimateHeaderClass,
  estimateHeaderDesktopActionsClass,
  estimateHeaderInlineActionButtonClass,
  estimateHeaderInlineActionMenuItemClass,
  estimateHeaderMobileMetaClass,
  estimateHeaderPrimaryClass,
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
  archivedAt?: string | null;
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
  workflow: EstimateVersionWorkflowClient;
  isSending: boolean;
  onOpenSendDialog: (mode: EstimateSendDialogMode) => void;
  rulesApplied?: boolean;
  isPinned?: boolean;
  canManualRetryAiDraft?: boolean;
  onBeforePdfExport?: () => Promise<EstimatePdfBeforeExportResult>;
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
  isArchived: boolean;
  versions: Version[];
  workflow: EstimateVersionWorkflowClient;
  isSending: boolean;
  onOpenSendDialog: (mode: EstimateSendDialogMode) => void;
  isPinned: boolean;
  canManualRetryAiDraft?: boolean;
  onBeforePdfExport?: () => Promise<EstimatePdfBeforeExportResult>;
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
  isArchived,
  versions,
  workflow,
  isSending,
  onOpenSendDialog,
  isPinned,
  canManualRetryAiDraft = false,
  onBeforePdfExport,
  onPreviewPdf,
  isPreviewLoading = false,
  trigger,
}: EstimateHeaderMoreMenuProps) {
  const t = useTranslations("estimates");

  const workflowActionProps = {
    estimateId,
    versionId: activeVersionId,
    workspaceId,
    workspaceSlug,
    locale,
    versionStatus: activeStatus,
    workflow,
    isSending,
    onOpenSendDialog,
    variant: "menu" as const,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <EstimateHeaderWorkflowActions {...workflowActionProps} />
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
          isArchived={isArchived}
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
  workflow,
  isSending,
  onOpenSendDialog,
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
  const activeStatus = workflow.status;
  const isArchived = workflow.archivedAt != null;
  const headerTitle = title ?? t("editor.titleEyebrow");

  const statusBadge = (
    <EstimateHeaderStatusBadge
      versionStatus={activeStatus}
      isArchived={isArchived}
      autosaveStatus={autosaveStatus}
    />
  );

  const workflowActionProps = {
    estimateId,
    versionId: activeVersionId,
    workspaceId,
    workspaceSlug,
    locale,
    versionStatus: activeStatus,
    workflow,
    isSending,
    onOpenSendDialog,
    variant: "inline" as const,
  };

  const moreMenuProps = {
    title,
    estimateId,
    workspaceId,
    workspaceSlug,
    locale,
    activeVersionId,
    activeStatus,
    isArchived,
    versions,
    workflow,
    isSending,
    onOpenSendDialog,
    isPinned,
    canManualRetryAiDraft,
    onBeforePdfExport,
    onPreviewPdf,
    isPreviewLoading,
  };

  return (
    <header className={estimateHeaderClass}>
      <div className={estimateHeaderPrimaryClass}>
        <div className="min-w-0">
          <h1 className={estimateHeaderTitleClass}>
            {t("editor.titleWithVersion", {
              title: headerTitle,
              version: activeVersionNumber,
            })}
          </h1>
        </div>
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
              className={estimateOutlineIconButtonClassName}
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
          <EstimateHeaderWorkflowActions {...workflowActionProps} />
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
