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
import { leaveWorkspaceAction } from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";

export function LeaveWorkspaceDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  locale: Locale;
}) {
  const t = useTranslations("sidebar.account");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);

    startTransition(async () => {
      const result = await leaveWorkspaceAction(workspaceId, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);

      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }

      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("leaveWorkspaceConfirmTitle", { name: workspaceName })}</DialogTitle>
          <DialogDescription>{t("leaveWorkspaceConfirmDescription")}</DialogDescription>
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
            {t("leaveWorkspaceConfirmCancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? t("leavingWorkspace") : t("leaveWorkspaceConfirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
