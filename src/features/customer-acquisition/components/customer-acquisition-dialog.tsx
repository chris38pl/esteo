"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
      <DialogContent className="max-w-xl gap-4">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription>{t("dialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <CustomerFormLinkSection locale={locale} workspaceSlug={workspaceSlug} />
          <CustomerFormQrSection locale={locale} workspaceSlug={workspaceSlug} />
          <CustomerFormStatsSection stats={stats} loading={pending} locale={locale} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
