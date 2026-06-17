"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { removeWorkspaceMemberAction } from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";

export function RemoveWorkspaceMemberDialog({
  open,
  onOpenChange,
  workspaceId,
  memberName,
  targetUserId,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  memberName: string;
  targetUserId: string;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings.users");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  function handleConfirm() {
    setError(null);

    startTransition(async () => {
      const result = await removeWorkspaceMemberAction(workspaceId, targetUserId, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("removeConfirmTitle", { name: memberName })}</DialogTitle>
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
            onClick={() => handleOpenChange(false)}
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
