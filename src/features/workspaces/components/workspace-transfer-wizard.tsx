"use client";

import { useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import type { SessionVerificationLevel } from "@clerk/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { SensitiveActionReverificationDialog } from "@/components/auth/sensitive-action-reverification-dialog";
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
import type { TransferEligibilityView } from "@/features/workspaces/components/transfer-types";
import { initiateWorkspaceOwnershipTransferAction } from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";

type WizardStep = "form" | "confirm";

type ReverificationState = {
  complete: () => void;
  cancel: () => void;
  level: SessionVerificationLevel | undefined;
  inProgress: boolean;
};

export function WorkspaceTransferWizard({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  eligibility,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  eligibility: TransferEligibilityView;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings.transfer.wizard");
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("form");
  const [toEmail, setToEmail] = useState("");
  const [keepSenderAsMember, setKeepSenderAsMember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [verificationState, setVerificationState] = useState<ReverificationState | undefined>(
    undefined,
  );

  const initiateTransfer = useReverification(
    initiateWorkspaceOwnershipTransferAction,
    {
      onNeedsReverification: ({ complete, cancel, level }) => {
        setVerificationState({
          complete,
          cancel,
          level,
          inProgress: true,
        });
      },
    },
  );

  const periodEndLabel = eligibility.currentPeriodEnd
    ? new Date(eligibility.currentPeriodEnd).toLocaleDateString(
        locale === "pl" ? "pl-PL" : "en-US",
        { dateStyle: "long" },
      )
    : null;

  function resetState() {
    setStep("form");
    setToEmail("");
    setKeepSenderAsMember(true);
    setError(null);
    setVerificationState(undefined);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetState();
    }
    onOpenChange(next);
  }

  function handleInitiate() {
    setError(null);

    startTransition(async () => {
      try {
        const result = await initiateTransfer(
          workspaceId,
          { toEmail: toEmail.trim(), keepSenderAsMember },
          locale,
        );

        if (!result || (typeof result === "object" && "success" in result && !result.success)) {
          const message =
            result && typeof result === "object" && "error" in result && result.error
              ? String(result.error)
              : t("errors.generic");
          setError(message);
          return;
        }

        handleOpenChange(false);
        router.refresh();
      } catch (caught) {
        if (isReverificationCancelledError(caught)) {
          return;
        }
        setError(t("errors.generic"));
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md rounded-2xl">
          {step === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle>{t("title", { name: workspaceName })}</DialogTitle>
                <DialogDescription>{t("description")}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-foreground">
                  <p>{t("billingNotice")}</p>
                  {periodEndLabel ? (
                    <p className="mt-2 font-medium">{t("activeUntil", { date: periodEndLabel })}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer-recipient-email">{t("emailLabel")}</Label>
                  <Input
                    id="transfer-recipient-email"
                    type="email"
                    autoComplete="off"
                    placeholder={t("emailPlaceholder")}
                    value={toEmail}
                    onChange={(event) => setToEmail(event.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-border/60 px-3 py-3">
                  <Checkbox
                    id="keep-sender-member"
                    checked={keepSenderAsMember}
                    onCheckedChange={(checked) => setKeepSenderAsMember(checked === true)}
                    disabled={isPending}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="keep-sender-member" className="cursor-pointer font-medium">
                      {t("keepMemberLabel")}
                    </Label>
                    <p className="text-sm text-muted-foreground">{t("keepMemberHint")}</p>
                  </div>
                </div>

                {!keepSenderAsMember ? (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {t("loseAccessWarning")}
                  </p>
                ) : null}

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setError(null);
                    if (!toEmail.trim()) {
                      setError(t("errors.emailRequired"));
                      return;
                    }
                    setStep("confirm");
                  }}
                  disabled={isPending || !toEmail.trim()}
                >
                  {t("continue")}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t("confirmTitle")}</DialogTitle>
                <DialogDescription>{t("confirmDescription")}</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-sm">
                <p>
                  <span className="text-muted-foreground">{t("confirmRecipient")}</span>{" "}
                  <span className="font-medium">{toEmail.trim()}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t("confirmPlan")}</span>{" "}
                  <span className="font-medium">{eligibility.plan}</span>
                </p>
                {periodEndLabel ? (
                  <p>
                    <span className="text-muted-foreground">{t("confirmPeriodEnd")}</span>{" "}
                    <span className="font-medium">{periodEndLabel}</span>
                  </p>
                ) : null}
                <p className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
                  {t("confirmBillingNotice")}
                </p>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("form")}
                  disabled={isPending}
                >
                  {t("back")}
                </Button>
                <Button type="button" onClick={handleInitiate} disabled={isPending}>
                  {isPending ? t("submitting") : t("submit")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {verificationState?.inProgress ? (
        <SensitiveActionReverificationDialog
          open
          level={verificationState.level}
          onComplete={() => {
            verificationState.complete();
            setVerificationState(undefined);
          }}
          onCancel={() => {
            verificationState.cancel();
            setVerificationState(undefined);
          }}
        />
      ) : null}
    </>
  );
}
