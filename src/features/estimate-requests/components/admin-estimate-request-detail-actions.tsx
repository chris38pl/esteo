"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminRestoreEstimateRequestAction } from "@/features/estimate-requests/server/admin-actions";
import type { Locale } from "@/lib/locale";

export function AdminEstimateRequestDetailActions({
  requestId,
  requestNumber,
  locale,
  deletedAt,
}: {
  requestId: string;
  requestNumber: string | null;
  locale: Locale;
  deletedAt: Date | null;
}) {
  const t = useTranslations("admin.estimateRequests");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!deletedAt || isRestored) {
    return null;
  }

  function handleRestore() {
    setError(null);
    startTransition(async () => {
      const result = await adminRestoreEstimateRequestAction(requestId, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsRestored(true);
      setDialogOpen(false);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant="secondary"
          className="rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive"
        >
          {t("deleted.badge")}
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => {
            setError(null);
            setDialogOpen(true);
          }}
        >
          {t("actions.restore")}
        </Button>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("restore.title", {
                requestNumber: requestNumber ?? requestId,
              })}
            </DialogTitle>
            <DialogDescription>{t("restore.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => setDialogOpen(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="button" disabled={isPending} onClick={handleRestore}>
              {isPending ? t("actions.restoring") : t("actions.restoreConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
