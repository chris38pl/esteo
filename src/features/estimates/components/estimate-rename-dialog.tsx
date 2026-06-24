"use client";

import { useEffect, useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import { useMobileKeyboardViewportInset } from "@/features/estimates/hooks/use-mobile-keyboard-viewport-inset";
import {
  createMobileDismissGuardedOpenChange,
  getMobileSheetOutsideDismissHandlers,
  useIgnoreInitialOutsideDismiss,
} from "@/features/estimates/hooks/use-mobile-outside-dismiss-guard";
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
  const isMobile = useEstimateMobileLayout();
  const ignoreOutsideDismissRef = useIgnoreInitialOutsideDismiss(open && isMobile);
  const keyboardInset = useMobileKeyboardViewportInset(open && isMobile);
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

  const handleOpenChange = createMobileDismissGuardedOpenChange(
    ignoreOutsideDismissRef,
    onOpenChange,
  );

  function scrollTitleInputIntoView() {
    requestAnimationFrame(() => {
      document
        .getElementById("estimate-rename-title")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

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
        appToast.success(t("header.rename.success"));
        onOpenChange(false);
        router.refresh();
        return;
      }

      setError(result.error || t("editor.titleSaveError"));
      appToast.error(result.error || t("editor.titleSaveError"));
    });
  }

  const dialogTitle = t("header.rename.title");
  const dialogDescription = t("header.rename.description");

  const formFields = (
    <>
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
          autoFocus={!isMobile}
          onFocus={scrollTitleInputIntoView}
          className="h-11 rounded-xl"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </>
  );

  const actionButtons = (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => handleOpenChange(false)}
      >
        {t("header.rename.cancel")}
      </Button>
      <Button type="submit" disabled={!canSave}>
        {pending ? t("header.rename.saving") : t("header.rename.save")}
      </Button>
    </>
  );

  const sheetOutsideHandlers = getMobileSheetOutsideDismissHandlers(
    ignoreOutsideDismissRef,
  );

  const mobileSheetStyle: CSSProperties | undefined =
    keyboardInset > 0
      ? {
          bottom: keyboardInset,
          maxHeight: `calc(100dvh - ${keyboardInset}px)`,
        }
      : undefined;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          className="z-[80] h-auto max-h-[min(90dvh,100%)] gap-0 p-0"
          overlayClassName="z-[80]"
          showCloseButton
          style={mobileSheetStyle}
          onOpenAutoFocus={(event) => event.preventDefault()}
          {...sheetOutsideHandlers}
        >
          <SheetHeader className="border-b border-border/60 pb-4">
            <SheetTitle>{dialogTitle}</SheetTitle>
            <SheetDescription>{dialogDescription}</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {formFields}
            </div>
            <SheetFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
              {actionButtons}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields}
          <DialogFooter className="gap-2 sm:gap-2">{actionButtons}</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
