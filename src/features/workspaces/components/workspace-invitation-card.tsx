"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Building2, UsersRound } from "lucide-react";
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
import { cn } from "@/lib/utils";

function daysUntilExpiry(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

type InvitationActionErrorCode = "WORKSPACE_SEAT_LIMIT";

export function WorkspaceInvitationCard({
  invitation,
  locale,
  variant = "card",
  heroPresentation = "page",
  onResolved,
}: {
  invitation: ReceivedInvitationView;
  locale: Locale;
  variant?: "card" | "embedded" | "hero" | "compact";
  heroPresentation?: "page" | "modal";
  onResolved?: () => void;
}) {
  const t = useTranslations("workspaces.invitations");
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<InvitationActionErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inviterEmail = invitation.invitedByEmail;
  const inviterLabel = invitation.invitedByName ?? invitation.invitedByEmail;
  const expiresLabel = new Date(invitation.expiresAt).toLocaleDateString(
    locale === "pl" ? "pl-PL" : "en-US",
    { dateStyle: "medium" },
  );
  const expiresInDays = daysUntilExpiry(invitation.expiresAt);

  function handleError(result: { success: false; error: string; code?: string }) {
    if (result.code === "WORKSPACE_SEAT_LIMIT") {
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

  const errorBlock = errorMessage ? (
    <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <p>{errorCode ? t(`errors.${errorCode}`) : errorMessage}</p>
      {errorCode === "WORKSPACE_SEAT_LIMIT" ? (
        <p className="text-destructive/90">{t("contactOwner")}</p>
      ) : null}
    </div>
  ) : null;

  const actions = (
    <div
      className={cn(
        "w-full gap-2",
        variant === "hero"
          ? "grid grid-cols-1 md:grid-cols-3 md:gap-3"
          : variant === "compact"
            ? "flex shrink-0 justify-end gap-2"
            : "flex flex-col sm:flex-row sm:flex-wrap",
      )}
    >
      {variant === "compact" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          className="rounded-lg"
          onClick={() => runAction(() => declineReceivedInvitationAction(invitation.id, locale))}
        >
          {t("decline")}
        </Button>
      ) : null}
      <Button
        type="button"
        size={variant === "compact" ? "sm" : "lg"}
        disabled={isPending}
        className={cn(
          "rounded-lg",
          variant === "hero" && "w-full md:justify-self-start",
        )}
        onClick={() => runAction(() => acceptReceivedInvitationAction(invitation.id, locale))}
      >
        {isPending ? t("accepting") : t("accept")}
        {variant === "hero" ? <ArrowRight className="size-4" strokeWidth={2.25} /> : null}
      </Button>
      {variant !== "compact" ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isPending}
          className={cn(
            "rounded-lg",
            variant === "hero" && "w-full md:justify-self-center",
          )}
          onClick={() => runAction(() => declineReceivedInvitationAction(invitation.id, locale))}
        >
          {t("decline")}
        </Button>
      ) : null}
      {variant === "hero" || variant === "embedded" ? (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={isPending}
          className={cn(
            "rounded-lg text-muted-foreground",
            variant === "hero" && "w-full md:justify-self-end md:px-2",
          )}
          onClick={() => runAction(() => dismissInvitationPromptAction(invitation.id, locale))}
        >
          {t("dismissPrompt")}
        </Button>
      ) : null}
    </div>
  );

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/15 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border/60">
              <Building2 className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-semibold tracking-tight text-foreground">
                {invitation.workspaceName}
              </p>
              <p className="break-words text-xs text-muted-foreground">
                {t("invitedBy", { name: inviterLabel })}
              </p>
              <p className="text-xs whitespace-nowrap text-muted-foreground">
                {t("expiresInDays", { count: expiresInDays })}
              </p>
            </div>
          </div>
          {actions}
        </div>
        {errorBlock ? <div className="mt-3">{errorBlock}</div> : null}
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <article
        className={cn(
          "w-full overflow-hidden rounded-2xl border border-border/60 shadow-sm",
          heroPresentation === "modal"
            ? "bg-card/90 backdrop-blur-xl dark:bg-card/75"
            : "bg-card md:rounded-3xl md:bg-card/90 md:backdrop-blur-xl dark:bg-card md:dark:bg-card/75",
        )}
      >
        <div className="space-y-7 px-5 py-8 sm:px-6 sm:py-10 md:space-y-8 md:px-10 md:py-12">
          <header className="space-y-4 text-center">
            <div className="flex justify-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/25">
                <UsersRound className="size-7" strokeWidth={1.75} />
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                {t("hubHeadlineBefore")}{" "}
                <span className="text-primary">{t("hubHeadlineAccent")}</span>
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("hubSubtitle", { email: inviterEmail })}
              </p>
            </div>
          </header>

          <div className="mx-auto w-full space-y-4 md:min-w-[26rem]">
            <div className="w-full rounded-2xl border border-border/60 bg-muted/35 px-4 py-3.5 dark:bg-muted/25">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-border/60">
                  <Building2 className="size-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold tracking-tight text-foreground">
                      {invitation.workspaceName}
                    </p>
                    <Badge variant="secondary" className="rounded-md px-2 py-0 text-[11px] font-medium">
                      {t(`roles.${invitation.role}`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("expiresAt", { date: expiresLabel })}
                  </p>
                </div>
              </div>
            </div>

            {errorBlock}

            {actions}
          </div>
        </div>
      </article>
    );
  }

  const containerClass =
    variant === "embedded"
      ? "rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
      : "rounded-xl border border-border/60 bg-card/90 p-5 shadow-sm backdrop-blur-md";

  return (
    <div className={containerClass}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight">{invitation.workspaceName}</h3>
          <Badge variant="secondary">{t(`roles.${invitation.role}`)}</Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("invitedBy", {
            name: inviterLabel,
          })}
        </p>

        <p className="text-xs text-muted-foreground">{t("expiresAt", { date: expiresLabel })}</p>
      </div>

      {errorBlock ? <div className="mt-4">{errorBlock}</div> : null}

      <div className="mt-5">{actions}</div>
    </div>
  );
}
