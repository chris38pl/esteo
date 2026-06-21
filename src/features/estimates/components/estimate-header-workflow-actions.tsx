"use client";

import type { EstimateVersionStatus } from "@prisma/client";
import { Check, RotateCcw, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { openEstimateWorkflowDialogDeferred } from "@/features/estimates/hooks/use-mobile-outside-dismiss-guard";
import { canReopenEstimateVersion } from "@/features/estimates/lib/version-reopen";
import type { EstimateVersionWorkflowClient } from "@/features/estimates/lib/serialize-estimate-version-workflow";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "./estimate-action-button-styles";
import {
  type EstimateSendDialogMode,
} from "./estimate-send-dialog";
import type { EstimateWorkflowDialogAction } from "./estimate-workflow-dialog";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import {
  estimateHeaderInlineActionButtonClass,
  estimateHeaderInlineActionMenuItemClass,
  estimateHeaderSendActionClass,
} from "@/features/estimates/lib/estimate-header-layout";

interface EstimateHeaderWorkflowActionsProps {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  versionStatus: EstimateVersionStatus;
  workflow: EstimateVersionWorkflowClient;
  isSending: boolean;
  onOpenSendDialog: (mode: EstimateSendDialogMode) => void;
  onOpenWorkflowDialog: (action: EstimateWorkflowDialogAction) => void;
  variant?: "inline" | "menu";
}

export function EstimateHeaderWorkflowActions({
  versionStatus,
  workflow,
  isSending,
  onOpenSendDialog,
  onOpenWorkflowDialog,
  variant = "inline",
}: EstimateHeaderWorkflowActionsProps) {
  const t = useTranslations("estimates");

  const isArchived = workflow.archivedAt != null;
  const canSend = versionStatus === "DRAFT" && !isArchived && !isSending;
  const canResend = versionStatus === "SENT" && !isArchived && !isSending;
  const canAccept = versionStatus === "SENT" && !isArchived && !isSending;
  const canReject = versionStatus === "SENT" && !isArchived && !isSending;
  const canReopen = canReopenEstimateVersion(versionStatus) && !isArchived && !isSending;

  function openSendDialog(mode: EstimateSendDialogMode) {
    onOpenSendDialog(mode);
  }

  function openWorkflowDialog(action: EstimateWorkflowDialogAction) {
    onOpenWorkflowDialog(action);
  }

  function openWorkflowDialogFromMenu(action: EstimateWorkflowDialogAction) {
    openEstimateWorkflowDialogDeferred(onOpenWorkflowDialog, action);
  }

  const inlineButtonClass = cn(
    estimateOutlineButtonClassName,
    estimateHeaderInlineActionButtonClass,
  );
  const menuItemClass = cn("gap-2", estimateHeaderInlineActionMenuItemClass);

  if (variant === "menu") {
    return (
      <>
        {canSend ? (
          <DropdownMenuItem
            className={menuItemClass}
            disabled={isSending}
            onSelect={() => openSendDialog("send")}
          >
            <Send className="size-4" />
            {t("header.actions.send")}
          </DropdownMenuItem>
        ) : null}
        {canResend ? (
          <DropdownMenuItem
            className={menuItemClass}
            disabled={isSending}
            onSelect={() => openSendDialog("resend")}
          >
            <Send className="size-4" />
            {t("header.actions.resend")}
          </DropdownMenuItem>
        ) : null}
        {canAccept ? (
          <DropdownMenuItem
            className={menuItemClass}
            disabled={isSending}
            onSelect={() => openWorkflowDialogFromMenu("accept")}
          >
            <Check className="size-4" />
            {t("header.actions.accept")}
          </DropdownMenuItem>
        ) : null}
        {canReject ? (
          <DropdownMenuItem
            className={menuItemClass}
            disabled={isSending}
            onSelect={() => openWorkflowDialogFromMenu("reject")}
          >
            <X className="size-4" />
            {t("header.actions.reject")}
          </DropdownMenuItem>
        ) : null}
        {canReopen ? (
          <DropdownMenuItem
            className={menuItemClass}
            disabled={isSending}
            onSelect={() => openWorkflowDialogFromMenu("reopen")}
          >
            <RotateCcw className="size-4" />
            {t("header.actions.reopen")}
          </DropdownMenuItem>
        ) : null}
      </>
    );
  }

  return (
    <>
      {canSend ? (
        <Button
          type="button"
          size="sm"
          className={cn(estimatePrimaryButtonClassName, estimateHeaderSendActionClass)}
          disabled={isSending}
          onClick={() => openSendDialog("send")}
        >
          {t("header.actions.send")}
        </Button>
      ) : null}
      {canResend ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={inlineButtonClass}
          disabled={isSending}
          onClick={() => openSendDialog("resend")}
        >
          {t("header.actions.resend")}
        </Button>
      ) : null}
      {canAccept ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={inlineButtonClass}
          disabled={isSending}
          onClick={() => openWorkflowDialog("accept")}
        >
          <Check className="size-4" />
          {t("header.actions.accept")}
        </Button>
      ) : null}
      {canReject ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={inlineButtonClass}
          disabled={isSending}
          onClick={() => openWorkflowDialog("reject")}
        >
          <X className="size-4" />
          {t("header.actions.reject")}
        </Button>
      ) : null}
      {canReopen ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={inlineButtonClass}
          disabled={isSending}
          onClick={() => openWorkflowDialog("reopen")}
        >
          <RotateCcw className="size-4" />
          {t("header.actions.reopen")}
        </Button>
      ) : null}
    </>
  );
}
