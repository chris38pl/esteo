"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import {
  acceptReceivedInvitationAction,
  declineReceivedInvitationAction,
  dismissInvitationPromptAction,
} from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";

type InvitationActionErrorCode = "INVITEE_PLAN_LIMIT" | "WORKSPACE_SEAT_LIMIT";

export function WorkspaceInvitationCard({
  invitation,
  locale,
  variant = "card",
  onResolved,
}: {
  invitation: ReceivedInvitationView;
  locale: Locale;
  variant?: "card" | "embedded";
  onResolved?: () => void;
}) {
  const t = useTranslations("workspaces.invitations");
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<InvitationActionErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const expiresLabel = new Date(invitation.expiresAt).toLocaleDateString(
    locale === "pl" ? "pl-PL" : "en-US",
    { dateStyle: "medium" },
  );

  function handleError(result: { success: false; error: string; code?: string }) {
    if (result.code === "INVITEE_PLAN_LIMIT" || result.code === "WORKSPACE_SEAT_LIMIT") {
      setErrorCode(result.code);
    }
    setErrorMessage(result.error);
  }

  function runAction(action: () => Promise<{ success: boolean; error?: string; code?: string }>) {
    setErrorCode(null);
    setErrorMessage(null);

    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        handleError(result as { success: false; error: string; code?: string });
        return;
      }

      onResolved?.();
      router.refresh();
    });
  }

  const containerClass =
    variant === "embedded"
      ? "rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
      : "rounded-xl border border-border/60 bg-muted/10 p-5";

  return (
    <div className={containerClass}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight">{invitation.workspaceName}</h3>
          <Badge variant="secondary">{t(`roles.${invitation.role}`)}</Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("invitedBy", {
            name: invitation.invitedByName ?? invitation.invitedByEmail,
          })}
        </p>

        <p className="text-xs text-muted-foreground">
          {t("expiresAt", { date: expiresLabel })}
        </p>
      </div>

      {errorMessage ? (
        <div className="mt-4 space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p>{errorCode ? t(`errors.${errorCode}`) : errorMessage}</p>
          {errorCode === "INVITEE_PLAN_LIMIT" ? (
            <Link
              href={`/${locale}/dashboard/billing`}
              className="inline-block font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("upgradePlan")}
            </Link>
          ) : null}
          {errorCode === "WORKSPACE_SEAT_LIMIT" ? (
            <p className="text-destructive/90">{t("contactOwner")}</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          disabled={isPending}
          className="rounded-lg"
          onClick={() =>
            runAction(() => acceptReceivedInvitationAction(invitation.id, locale))
          }
        >
          {isPending ? t("accepting") : t("accept")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          className="rounded-lg"
          onClick={() =>
            runAction(() => declineReceivedInvitationAction(invitation.id, locale))
          }
        >
          {t("decline")}
        </Button>
        {variant === "embedded" ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            className="rounded-lg"
            onClick={() =>
              runAction(() => dismissInvitationPromptAction(invitation.id, locale))
            }
          >
            {t("dismissPrompt")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
