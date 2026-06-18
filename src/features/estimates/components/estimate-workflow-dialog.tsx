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
import { Textarea } from "@/components/ui/textarea";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t(descriptionKey)}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {t("workflow.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("workflow.submitting") : t(submitKey)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
