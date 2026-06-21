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
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import {
  createMobileDismissGuardedOpenChange,
  getMobileSheetOutsideDismissHandlers,
  useIgnoreInitialOutsideDismiss,
} from "@/features/estimates/hooks/use-mobile-outside-dismiss-guard";
import {
  acceptEstimateVersionAction,
  rejectEstimateVersionAction,
  reopenEstimateVersionAction,
} from "@/features/estimates/server/send-estimate-actions";
import type { Locale } from "@/lib/locale";

export type EstimateWorkflowDialogAction = "accept" | "reject" | "reopen";

export function EstimateWorkflowDialog({
  open,
  onOpenChange,
  action,
  estimateId,
  versionId,
  workspaceId,
  workspaceSlug,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: EstimateWorkflowDialogAction;
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const isMobile = useEstimateMobileLayout();
  const ignoreOutsideDismissRef = useIgnoreInitialOutsideDismiss(open && isMobile);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setNote("");
      setError(null);
    }
  }, [open]);

  const titleKey =
    action === "accept"
      ? "workflow.acceptTitle"
      : action === "reject"
        ? "workflow.rejectTitle"
        : "workflow.reopenTitle";
  const descriptionKey =
    action === "accept"
      ? "workflow.acceptDescription"
      : action === "reject"
        ? "workflow.rejectDescription"
        : "workflow.reopenDescription";
  const noteLabelKey =
    action === "accept"
      ? "workflow.acceptNoteLabel"
      : action === "reject"
        ? "workflow.rejectNoteLabel"
        : "workflow.reopenNoteLabel";
  const submitKey =
    action === "accept"
      ? "workflow.acceptSubmit"
      : action === "reject"
        ? "workflow.rejectSubmit"
        : "workflow.reopenSubmit";

  const handleOpenChange = createMobileDismissGuardedOpenChange(
    ignoreOutsideDismissRef,
    onOpenChange,
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      const payload = {
        estimateId,
        versionId,
        workspaceId,
        workspaceSlug,
        locale,
        note: note.trim() || undefined,
      };

      const result =
        action === "accept"
          ? await acceptEstimateVersionAction(payload)
          : action === "reject"
            ? await rejectEstimateVersionAction(payload)
            : await reopenEstimateVersionAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  const title = t(titleKey);
  const description = t(descriptionKey);

  const formFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="estimate-workflow-note">{t(noteLabelKey)}</Label>
        <Textarea
          id="estimate-workflow-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={pending}
          rows={3}
          className="rounded-xl"
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
        {t("workflow.cancel")}
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? t("workflow.submitting") : t(submitKey)}
      </Button>
    </>
  );

  const sheetOutsideHandlers = getMobileSheetOutsideDismissHandlers(
    ignoreOutsideDismissRef,
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          className="z-[80] gap-0 p-0"
          overlayClassName="z-[80]"
          showCloseButton
          {...sheetOutsideHandlers}
        >
          <SheetHeader className="border-b border-border/60 pb-4">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="space-y-4 px-5 py-4">{formFields}</div>
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields}
          <DialogFooter className="gap-2 sm:gap-2">{actionButtons}</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
