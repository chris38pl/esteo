"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import { cn } from "@/lib/utils";

export function WorkspacePlanBadge({
  billingSidebarState,
  variant = "hero",
  className,
  href,
}: {
  billingSidebarState: BillingSidebarState;
  variant?: "hero" | "default";
  className?: string;
  /** When set (owner), the badge links to workspace billing. */
  href?: string | null;
}) {
  const t = useTranslations("sidebar.workspaceCard");

  const planLabel =
    billingSidebarState.variant === "status"
      ? billingSidebarState.plan
      : billingSidebarState.currentPlan;

  const isBusiness = planLabel === "BUSINESS";
  const isPro = planLabel === "PRO";
  const isFree = planLabel === "FREE";

  const badgeClassName =
    variant === "hero"
      ? cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
          "text-[8px] font-semibold tracking-[0.08em] uppercase",
          "bg-white/80 text-emerald-800 shadow-sm backdrop-blur-sm",
          "ring-1 ring-white/60",
          isBusiness && "text-emerald-800",
          isPro && "text-emerald-800",
          isFree && "text-slate-700",
          href &&
            "cursor-pointer transition hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
          className,
        )
      : cn(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-px",
          "text-[8px] font-semibold tracking-[0.12em] uppercase",
          "bg-muted/70 text-foreground/80 ring-1 ring-border/45",
          isBusiness && "text-emerald-700",
          isPro && "text-blue-700",
          !isBusiness && !isPro && "text-slate-700",
          href &&
            "cursor-pointer transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
          className,
        );

  const content = (
    <>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          variant === "hero"
            ? cn((isBusiness || isPro) && "bg-emerald-500", isFree && "bg-slate-400")
            : isBusiness
              ? "bg-emerald-500"
              : isPro
                ? "bg-blue-500"
                : "bg-slate-400",
        )}
        aria-hidden
      />
      {t("planBadge", { plan: planLabel })}
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-label={t("openBilling")} className={badgeClassName}>
        {content}
      </Link>
    );
  }

  return <span className={badgeClassName}>{content}</span>;
}
