"use client";

import { useEffect, useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerFormLinkSection } from "@/features/customer-acquisition/components/customer-form-link-section";
import { CustomerFormQrSection } from "@/features/customer-acquisition/components/customer-form-qr-section";
import { CustomerFormStatsSection } from "@/features/customer-acquisition/components/customer-form-stats-section";
import {
  getCustomerAcquisitionStatsAction,
  type CustomerAcquisitionStats,
} from "@/features/customer-acquisition/server/get-customer-acquisition-stats";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  workspaceId: string | null;
  workspaceSlug: string | null;
};

export function CustomerAcquisitionDialog({
  open,
  onOpenChange,
  locale,
  workspaceId,
  workspaceSlug,
}: Props) {
  const t = useTranslations("customerAcquisition");
  const [stats, setStats] = useState<CustomerAcquisitionStats | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !workspaceId) {
      return;
    }

    startTransition(async () => {
      const result = await getCustomerAcquisitionStatsAction({ workspaceId, locale });
      if (result.success) {
        setStats(result.data);
      } else {
        setStats(null);
      }
    });
  }, [open, workspaceId, locale]);

  useEffect(() => {
    if (!open) {
      setStats(null);
    }
  }, [open]);

  if (!workspaceSlug) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          "inset-0 top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-5 overflow-y-auto rounded-none border-0 bg-card p-4 text-card-foreground shadow-none",
          "pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
          "sm:inset-auto sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-xl sm:border sm:border-border/60 sm:p-6 sm:shadow-sm",
        )}
      >
        <div className="flex items-center gap-3 pr-8">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserPlus className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 text-left">
            <DialogTitle className="text-lg leading-tight">{t("dialog.title")}</DialogTitle>
            <DialogDescription className="mt-1">{t("dialog.description")}</DialogDescription>
          </div>
        </div>

        <div className="space-y-4">
          <CustomerFormLinkSection locale={locale} workspaceSlug={workspaceSlug} />
          <CustomerFormQrSection locale={locale} workspaceSlug={workspaceSlug} />
          <CustomerFormStatsSection stats={stats} loading={pending} locale={locale} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
