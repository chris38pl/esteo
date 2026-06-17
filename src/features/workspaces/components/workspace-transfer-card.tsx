"use client";

import { useRouter } from "next/navigation";
import { ArrowRightLeft, Building2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReceivedOwnershipTransferView } from "@/features/workspaces/components/transfer-types";
import {
  acceptWorkspaceOwnershipTransferAction,
  declineWorkspaceOwnershipTransferAction,
} from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function WorkspaceTransferCard({
  transfer,
  locale,
  variant = "card",
  onResolved,
}: {
  transfer: ReceivedOwnershipTransferView;
  locale: Locale;
  variant?: "card" | "hero" | "compact";
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

  function runAction(action: () => Promise<{ success: boolean; error?: string; redirectTo?: string | null }>) {
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

  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const buttonSize = isHero ? "lg" : isCompact ? "sm" : "default";

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/60 bg-card shadow-sm",
        isHero ? "p-8 md:rounded-3xl" : isCompact ? "p-4" : "p-6",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          {isHero ? <ArrowRightLeft className="size-6" /> : <Building2 className="size-5" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("font-semibold tracking-tight", isHero ? "text-xl" : "text-base")}>
              {transfer.workspace.name}
            </h3>
            <Badge variant="secondary">{transfer.planSnapshot}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("fromSender", { name: senderLabel })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("activeUntil", { date: periodEndLabel })}
          </p>
          <p className="text-xs text-muted-foreground">{t("expiresAt", { date: expiresLabel })}</p>
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
            {t("billingNotice")}
          </p>
        </div>
      </div>

      {error ? (
        <p
          className={cn(
            "mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive",
            !isCompact && "mx-auto max-w-lg text-center",
          )}
        >
          {error}
        </p>
      ) : null}

      <div
        className={cn(
          "mx-auto grid w-full gap-2",
          isHero
            ? "mt-6 max-w-lg grid-cols-1 sm:grid-cols-2 sm:gap-3"
            : isCompact
              ? "mt-4 max-w-xs grid-cols-2"
              : "mt-4 max-w-md grid-cols-1 sm:grid-cols-2",
        )}
      >
        <Button
          type="button"
          size={buttonSize}
          onClick={() => runAction(() => acceptWorkspaceOwnershipTransferAction(transfer.token, locale))}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? t("accepting") : t("accept")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size={buttonSize}
          onClick={() => runAction(() => declineWorkspaceOwnershipTransferAction(transfer.token, locale))}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? t("declining") : t("decline")}
        </Button>
      </div>
    </article>
  );
}
