"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteUserAccountAction } from "@/features/users/server/account-actions";
import type { Locale } from "@/lib/locale";

const CONFIRM_WORD: Record<Locale, string> = {
  pl: "USUŃ",
  en: "DELETE",
};

export function DeleteAccountDialog({
  open,
  onOpenChange,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
}) {
  const t = useTranslations("navbar.userMenu.accountDeletion");
  const { signOut } = useClerk();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmWord = CONFIRM_WORD[locale];
  const canConfirm = confirmText === confirmWord;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setConfirmText("");
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleConfirm() {
    if (!canConfirm || isDeleting) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    const result = await deleteUserAccountAction(locale);

    if (!result.success) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }

    const signInUrl = `/${locale}/sign-in`;

    try {
      await signOut({ redirectUrl: signInUrl });
    } catch {
      // Clerk user was deleted server-side; session cleanup may fail.
    }

    window.location.assign(signInUrl);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("confirmTitle")}</DialogTitle>
          <DialogDescription>{t("confirmDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="delete-account-confirm">{t("confirmTypeDelete", { word: confirmWord })}</Label>
          <Input
            id="delete-account-confirm"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={confirmWord}
            autoComplete="off"
            disabled={isDeleting}
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            disabled={isDeleting}
            onClick={() => handleOpenChange(false)}
          >
            {t("confirmCancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting || !canConfirm}
            onClick={handleConfirm}
          >
            {isDeleting ? t("deleting") : t("confirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
