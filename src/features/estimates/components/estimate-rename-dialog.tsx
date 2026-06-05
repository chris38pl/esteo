"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { ESTIMATE_TITLE_MAX_LENGTH } from "@/features/estimates/schemas/estimate-title";
import { updateEstimateTitleAction } from "@/features/estimates/server/actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function EstimateRenameDialog({
  open,
  onOpenChange,
  initialTitle,
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle?: string | null;
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setTitle(initialTitle ?? "");
      setError(null);
    }
  }, [initialTitle, open]);

  const trimmedTitle = title.trim();
  const titleOverLimit = title.length > ESTIMATE_TITLE_MAX_LENGTH;
  const canSave = !pending && !titleOverLimit;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) {
      return;
    }

    startTransition(async () => {
      const result = await updateEstimateTitleAction({
        estimateId,
        workspaceId,
        workspaceSlug,
        title: trimmedTitle,
        locale,
      });

      if (result.success) {
        onOpenChange(false);
        router.refresh();
        return;
      }

      setError(result.error || t("editor.titleSaveError"));
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("header.rename.title")}</DialogTitle>
          <DialogDescription>{t("header.rename.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="estimate-rename-title">{t("header.rename.label")}</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  titleOverLimit ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {t("header.rename.counter", {
                  count: title.length,
                  max: ESTIMATE_TITLE_MAX_LENGTH,
                })}
              </span>
            </div>
            <Input
              id="estimate-rename-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("header.rename.placeholder")}
              maxLength={ESTIMATE_TITLE_MAX_LENGTH}
              disabled={pending}
              autoFocus
              className="h-11 rounded-xl"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {t("header.rename.cancel")}
            </Button>
            <Button type="submit" disabled={!canSave}>
              {pending ? t("header.rename.saving") : t("header.rename.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
