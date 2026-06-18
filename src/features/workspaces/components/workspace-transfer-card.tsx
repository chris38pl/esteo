"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, ArrowRightLeft, Building2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReceivedOwnershipTransferView } from "@/features/workspaces/components/transfer-types";
import {
  acceptWorkspaceOwnershipTransferAction,
  declineWorkspaceOwnershipTransferAction,
  dismissTransferPromptAction,
} from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function WorkspaceTransferCard({
  transfer,
  locale,
  variant = "card",
  heroPresentation = "page",
  onResolved,
}: {
  transfer: ReceivedOwnershipTransferView;
  locale: Locale;
  variant?: "card" | "hero" | "compact";
  heroPresentation?: "page" | "modal";
  onResolved?: () => void;
}) {
  const t = useTranslations("workspaces.transfer");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const senderLabel = transfer.fromUser.name ?? transfer.fromUser.email;
  const periodEndLabel = new Date(transfer.periodEndSnapshot).toLocaleDateString(
    locale === "pl" ? "pl-PL" : "en-US",
    { dateStyle: "long" },
  );
  const expiresLabel = new Date(transfer.expiresAt).toLocaleDateString(
    locale === "pl" ? "pl-PL" : "en-US",
    { dateStyle: "medium" },
  );

  function runAction(
    action: () => Promise<{ success: boolean; error?: string; redirectTo?: string | null }>,
  ) {
    setError(null);

    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        setError(result.error ?? t("errorGeneric"));
        return;
      }

      onResolved?.();

      if (result.redirectTo) {
        router.push(result.redirectTo);
        return;
      }

      router.refresh();
    });
  }

  const errorBlock = error ? (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </div>
  ) : null;

  const actions = (
    <div
      className={cn(
        "grid w-full gap-2",
        variant === "hero"
          ? "grid-cols-1 md:grid-cols-[1fr_1fr_1fr]"
          : variant === "compact"
            ? "grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2",
      )}
    >
      {variant === "compact" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          className="rounded-lg"
          onClick={() =>
            runAction(() => declineWorkspaceOwnershipTransferAction(transfer.token, locale))
          }
        >
          {t("decline")}
        </Button>
      ) : null}
      <Button
        type="button"
        size={variant === "compact" ? "sm" : "lg"}
        disabled={isPending}
        className={cn("rounded-lg", variant === "hero" && "w-full md:justify-self-start")}
        onClick={() =>
          runAction(() => acceptWorkspaceOwnershipTransferAction(transfer.token, locale))
        }
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
          className={cn("rounded-lg", variant === "hero" && "w-full md:justify-self-center")}
          onClick={() =>
            runAction(() => declineWorkspaceOwnershipTransferAction(transfer.token, locale))
          }
        >
          {isPending ? t("declining") : t("decline")}
        </Button>
      ) : null}
      {variant === "hero" ? (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={isPending}
          className="w-full rounded-lg text-muted-foreground md:justify-self-end md:px-2"
          onClick={() => runAction(() => dismissTransferPromptAction(transfer.id, locale))}
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
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold tracking-tight text-foreground">
                  {transfer.workspace.name}
                </p>
                <Badge variant="secondary" className="rounded-md px-2 py-0 text-[11px] font-medium">
                  {transfer.planSnapshot}
                </Badge>
              </div>
              <p className="break-words text-xs text-muted-foreground">
                {t("fromSender", { name: senderLabel })}
              </p>
              <p className="text-xs whitespace-nowrap text-muted-foreground">
                {t("expiresAt", { date: expiresLabel })}
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
                <ArrowRightLeft className="size-7" strokeWidth={1.75} />
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                {t("hubHeadlineBefore")}{" "}
                <span className="text-primary">{t("hubHeadlineAccent")}</span>
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("hubSubtitle", { name: senderLabel })}
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
                      {transfer.workspace.name}
                    </p>
                    <Badge variant="secondary" className="rounded-md px-2 py-0 text-[11px] font-medium">
                      {transfer.planSnapshot}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("activeUntil", { date: periodEndLabel })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("expiresAt", { date: expiresLabel })}
                  </p>
                </div>
              </div>
            </div>

            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
              {t("billingNotice")}
            </p>

            {errorBlock}
            {actions}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Building2 className="size-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">{transfer.workspace.name}</h3>
            <Badge variant="secondary">{transfer.planSnapshot}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{t("fromSender", { name: senderLabel })}</p>
          <p className="text-sm text-muted-foreground">
            {t("activeUntil", { date: periodEndLabel })}
          </p>
          <p className="text-xs text-muted-foreground">{t("expiresAt", { date: expiresLabel })}</p>
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
            {t("billingNotice")}
          </p>
        </div>
      </div>

      {errorBlock ? <div className="mt-4">{errorBlock}</div> : null}
      <div className="mx-auto mt-4 max-w-md">{actions}</div>
    </article>
  );
}
