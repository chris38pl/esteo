"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import type { EstimateVersionStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { calculateEstimate, type LineItemCalcInput } from "@/features/estimates/lib/calculate-estimate";
import { estimateMobileStickyBarClass } from "@/features/estimates/lib/estimate-layout-config";
import { estimatePrimaryButtonClassName } from "./estimate-action-button-styles";
import { EstimateSendDialog } from "./estimate-send-dialog";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface EstimateMobileStickyBarProps {
  items: LineItemCalcInput[];
  currency: string;
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  versionStatus: EstimateVersionStatus;
  defaultEmail?: string | null;
  isSending: boolean;
  onSendStarted: (payload: { sendId: string; runId: string }) => void;
}

function formatCurrency(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function EstimateMobileStickyBar({
  items,
  currency,
  estimateId,
  versionId,
  workspaceId,
  workspaceSlug,
  locale,
  versionStatus,
  defaultEmail,
  isSending,
  onSendStarted,
}: EstimateMobileStickyBarProps) {
  const t = useTranslations("estimates");
  const [mounted, setMounted] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const calc = calculateEstimate(items, 0);
  const canSend = versionStatus === "DRAFT" && !isSending;

  useEffect(() => {
    setMounted(true);
  }, []);

  const bar = (
    <div
      className={cn(
        estimateMobileStickyBarClass,
        "fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-border/80 bg-card px-4 pt-3",
      )}
      style={{
        paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{t("summary.gross")}</p>
        <p className="truncate text-lg font-semibold tabular-nums text-primary">
          {formatCurrency(calc.totalGross, currency, locale)}
        </p>
      </div>
      {canSend ? (
        <Button
          type="button"
          size="sm"
          className={cn(estimatePrimaryButtonClassName, "shrink-0")}
          disabled={isSending}
          onClick={() => setSendDialogOpen(true)}
        >
          {t("header.actions.sendEstimate")}
          <Send className="size-4" />
        </Button>
      ) : null}
      <EstimateSendDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        mode="send"
        estimateId={estimateId}
        versionId={versionId}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        locale={locale}
        defaultEmail={defaultEmail}
        onSendStarted={onSendStarted}
      />
    </div>
  );

  if (!mounted) return null;
  return createPortal(bar, document.body);
}
