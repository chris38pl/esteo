"use client";

import { useState } from "react";
import type { EstimateVersionStatus } from "@prisma/client";
import { Check, RotateCcw, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { canReopenEstimateVersion } from "@/features/estimates/lib/version-reopen";
import type { EstimateVersionWorkflowClient } from "@/features/estimates/lib/serialize-estimate-version-workflow";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "./estimate-action-button-styles";
import { EstimateSendDialog } from "./estimate-send-dialog";
import {
  EstimateWorkflowDialog,
  type EstimateWorkflowDialogAction,
} from "./estimate-workflow-dialog";
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
  onSendStarted: (payload: { sendId: string; runId: string }) => void;
  variant?: "inline" | "menu";
}

export function EstimateHeaderWorkflowActions({
  estimateId,
  versionId,
  workspaceId,
  workspaceSlug,
  locale,
  versionStatus,
  workflow,
  isSending,
  onSendStarted,
  variant = "inline",
}: EstimateHeaderWorkflowActionsProps) {
  const t = useTranslations("estimates");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendDialogMode, setSendDialogMode] = useState<"send" | "resend">("send");
  const [workflowDialogAction, setWorkflowDialogAction] =
    useState<EstimateWorkflowDialogAction | null>(null);

  const isArchived = workflow.archivedAt != null;
  const canSend = versionStatus === "DRAFT" && !isArchived && !isSending;
  const canResend = versionStatus === "SENT" && !isArchived && !isSending;
  const canAccept = versionStatus === "SENT" && !isArchived && !isSending;
  const canReject = versionStatus === "SENT" && !isArchived && !isSending;
  const canReopen = canReopenEstimateVersion(versionStatus) && !isArchived && !isSending;

  function openSendDialog(mode: "send" | "resend") {
    setSendDialogMode(mode);
    setSendDialogOpen(true);
  }

  function openWorkflowDialog(action: EstimateWorkflowDialogAction) {
    setWorkflowDialogAction(action);
  }

  const inlineButtonClass = cn(
    estimateOutlineButtonClassName,
    estimateHeaderInlineActionButtonClass,
  );
  const menuItemClass = cn("gap-2", estimateHeaderInlineActionMenuItemClass);

  const dialogs = (
    <>
      <EstimateSendDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        mode={sendDialogMode}
        estimateId={estimateId}
        versionId={versionId}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        locale={locale}
        defaultEmail={workflow.defaultCustomerEmail}
        onSendStarted={onSendStarted}
      />
      {workflowDialogAction ? (
        <EstimateWorkflowDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setWorkflowDialogAction(null);
            }
          }}
          action={workflowDialogAction}
          estimateId={estimateId}
          versionId={versionId}
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          locale={locale}
        />
      ) : null}
    </>
  );

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
            onSelect={() => openWorkflowDialog("accept")}
          >
            <Check className="size-4" />
            {t("header.actions.accept")}
          </DropdownMenuItem>
        ) : null}
        {canReject ? (
          <DropdownMenuItem
            className={menuItemClass}
            disabled={isSending}
            onSelect={() => openWorkflowDialog("reject")}
          >
            <X className="size-4" />
            {t("header.actions.reject")}
          </DropdownMenuItem>
        ) : null}
        {canReopen ? (
          <DropdownMenuItem
            className={menuItemClass}
            disabled={isSending}
            onSelect={() => openWorkflowDialog("reopen")}
          >
            <RotateCcw className="size-4" />
            {t("header.actions.reopen")}
          </DropdownMenuItem>
        ) : null}
        {dialogs}
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
      {dialogs}
    </>
  );
}
