"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { sendEstimateToCustomerAction } from "@/features/estimates/server/send-estimate-actions";
import type { Locale } from "@/lib/locale";

type SendDialogMode = "send" | "resend";

export function EstimateSendDialog({
  open,
  onOpenChange,
  mode,
  estimateId,
  versionId,
  workspaceId,
  workspaceSlug,
  locale,
  defaultEmail,
  onSendStarted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SendDialogMode;
  estimateId: string;
  versionId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  defaultEmail?: string | null;
  onSendStarted: (payload: { sendId: string; runId: string }) => void;
}) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [attachPdf, setAttachPdf] = useState(true);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail ?? "");
      setAttachPdf(true);
      setReason("");
      setError(null);
    }
  }, [defaultEmail, open]);

  const isResend = mode === "resend";
  const trimmedEmail = email.trim();
  const canSubmit = !pending && trimmedEmail.length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    startTransition(async () => {
      const result = await sendEstimateToCustomerAction({
        estimateId,
        versionId,
        workspaceId,
        workspaceSlug,
        locale,
        sentToEmail: trimmedEmail,
        attachPdf,
        isResend,
        activityNote: isResend && reason.trim() ? reason.trim() : undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      onSendStarted(result.data);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isResend ? t("send.resendTitle") : t("send.title")}
          </DialogTitle>
          <DialogDescription>
            {isResend ? t("send.resendDescription") : t("send.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="estimate-send-email">{t("send.toLabel")}</Label>
            <Input
              id="estimate-send-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("send.toPlaceholder")}
              disabled={pending}
              autoFocus
              className="h-11 rounded-xl"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={attachPdf}
              onCheckedChange={(checked) => setAttachPdf(checked === true)}
              disabled={pending}
            />
            {t("send.attachPdf")}
          </label>

          {isResend ? (
            <div className="space-y-2">
              <Label htmlFor="estimate-resend-reason">{t("send.reasonLabel")}</Label>
              <Textarea
                id="estimate-resend-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t("send.reasonPlaceholder")}
                disabled={pending}
                rows={3}
                className="rounded-xl"
              />
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {t("send.cancel")}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {pending
                ? t("send.submitting")
                : isResend
                  ? t("send.resendSubmit")
                  : t("send.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
