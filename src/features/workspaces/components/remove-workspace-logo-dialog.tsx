"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { appToast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { removeWorkspaceLogoAction } from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";

export function RemoveWorkspaceLogoDialog({
  open,
  onOpenChange,
  workspaceId,
  locale,
  onRemoved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  locale: Locale;
  onRemoved?: () => void;
}) {
  const t = useTranslations("workspaces.settings.logo");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);

    startTransition(async () => {
      const result = await removeWorkspaceLogoAction(workspaceId, locale);

      if (!result.success) {
        setError(result.error);
        appToast.error(result.error);
        return;
      }

      appToast.success(t("removeSuccessToast"));
      onRemoved?.();
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("removeConfirmTitle")}</DialogTitle>
          <DialogDescription>{t("removeConfirmDescription")}</DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("removeConfirmCancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? t("removing") : t("removeConfirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
