"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
import { sendEstimateToCustomerAction } from "@/features/estimates/server/send-estimate-actions";
import type { Locale } from "@/lib/locale";

type SendDialogMode = "send" | "resend";

const MOBILE_OUTSIDE_DISMISS_GUARD_MS = 450;

function useIgnoreInitialOutsideDismiss(open: boolean) {
  const ignoreRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    ignoreRef.current = true;
    const timer = window.setTimeout(() => {
      ignoreRef.current = false;
    }, MOBILE_OUTSIDE_DISMISS_GUARD_MS);

    return () => {
      window.clearTimeout(timer);
      ignoreRef.current = false;
    };
  }, [open]);

  return ignoreRef;
}

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
  const isMobile = useEstimateMobileLayout();
  const ignoreOutsideDismissRef = useIgnoreInitialOutsideDismiss(open && isMobile);
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
  const title = isResend ? t("send.resendTitle") : t("send.title");
  const description = isResend ? t("send.resendDescription") : t("send.description");
  const submitLabel = pending
    ? t("send.submitting")
    : isResend
      ? t("send.resendSubmit")
      : t("send.submit");

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && ignoreOutsideDismissRef.current) {
      return;
    }
    onOpenChange(nextOpen);
  }

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

  const formFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="estimate-send-email">{t("send.toLabel")}</Label>
        <Input
          id="estimate-send-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("send.toPlaceholder")}
          disabled={pending}
          autoFocus={!isMobile}
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
        {t("send.cancel")}
      </Button>
      <Button type="submit" disabled={!canSubmit}>
        {submitLabel}
      </Button>
    </>
  );

  const sheetOutsideHandlers = {
    onPointerDownOutside: (event: Event) => {
      if (ignoreOutsideDismissRef.current) {
        event.preventDefault();
      }
    },
    onInteractOutside: (event: Event) => {
      if (ignoreOutsideDismissRef.current) {
        event.preventDefault();
      }
    },
  };

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

export type EstimateSendDialogMode = SendDialogMode;

export function openEstimateSendDialogDeferred(
  open: (mode: SendDialogMode) => void | Promise<void>,
  mode: SendDialogMode = "send",
) {
  window.setTimeout(() => void open(mode), MOBILE_OUTSIDE_DISMISS_GUARD_MS / 3);
}
