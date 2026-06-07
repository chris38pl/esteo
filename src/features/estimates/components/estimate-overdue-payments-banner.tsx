"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface EstimateOverduePaymentsBannerProps {
  overdueCount: number;
  onOpenPayments: () => void;
}

export function EstimateOverduePaymentsBanner({
  overdueCount,
  onOpenPayments,
}: EstimateOverduePaymentsBannerProps) {
  const t = useTranslations("estimates.editor.payments");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (overdueCount <= 0) {
      setDismissed(false);
    }
  }, [overdueCount]);

  if (overdueCount <= 0 || dismissed) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center gap-1 rounded-lg border border-destructive/40 bg-destructive/5 pr-1 text-sm text-destructive">
      <button
        type="button"
        onClick={onOpenPayments}
        className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-destructive/10 rounded-l-lg"
      >
        <AlertTriangle className="size-4 shrink-0" aria-hidden />
        <span className="font-medium">{t("overdueBanner", { count: overdueCount })}</span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setDismissed(true)}
        aria-label={t("dismissOverdueBanner")}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
