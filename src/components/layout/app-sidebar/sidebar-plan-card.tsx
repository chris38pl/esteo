"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Crown, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { dashboardBillingHref, ownedWorkspaceBillingHref } from "@/lib/dashboard-routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PLAN_IMAGES = {
  free: "/sidebar/free-plan-image.png",
  pro: "/sidebar/pro-plan-image.png",
  business: "/sidebar/business-plan-image.png",
} as const;

/** Dark sidebar surface — fixed so the card matches in light + dark app theme */
const PLAN_CARD_SURFACE = "#091224";

const FEATURE_KEYS = {
  free: ["projects", "estimates", "support"] as const,
  pro: ["projects", "team", "permissions", "support"] as const,
  business: ["allFeatures", "projects", "team", "support"] as const,
};

type PlanCardVariant = keyof typeof PLAN_IMAGES;

function featureLabel(
  t: ReturnType<typeof useTranslations<"sidebar.planCards">>,
  variant: PlanCardVariant,
  key: (typeof FEATURE_KEYS)[PlanCardVariant][number],
) {
  switch (variant) {
    case "free":
      return t(`free.features.${key as (typeof FEATURE_KEYS)["free"][number]}`);
    case "pro":
      return t(`pro.features.${key as (typeof FEATURE_KEYS)["pro"][number]}`);
    case "business":
      return t(`business.features.${key as (typeof FEATURE_KEYS)["business"][number]}`);
  }
}

export function SidebarPlanCard({
  variant,
  locale,
  className,
  onDismiss,
}: {
  variant: PlanCardVariant;
  locale: string;
  className?: string;
  onDismiss?: () => void;
}) {
  const t = useTranslations("sidebar.planCards");
  const { activeWorkspace, workspaces } = useWorkspaceContext();
  const billingHref =
    activeWorkspace?.isOwner && activeWorkspace.slug
      ? dashboardBillingHref(locale as "pl" | "en", activeWorkspace.slug)
      : ownedWorkspaceBillingHref(locale as "pl" | "en", workspaces);

  if (!billingHref) {
    return null;
  }

  const featureKeys = FEATURE_KEYS[variant];
  const isBusiness = variant === "business";

  return (
    <div
      className={cn(
        "dark relative isolate box-border w-full min-w-0 max-w-full overflow-hidden rounded-xl",
        "border border-white/10 bg-[#091224] text-slate-300",
        className,
      )}
      style={{ backgroundColor: PLAN_CARD_SURFACE }}
    >
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("dismiss")}
          className={cn(
            "absolute top-2 right-2 z-20 flex size-7 items-center justify-center rounded-md",
            "text-white/35 transition-colors duration-200",
            "hover:bg-white/10 hover:text-white/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
          )}
        >
          <X className="size-3.5" strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0">
          <Image
            src={PLAN_IMAGES[variant]}
            alt=""
            fill
            sizes="(max-width: 768px) 90vw, 232px"
            className="object-contain object-right-top"
            priority={false}
          />
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[52%]"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, color-mix(in oklab, ${PLAN_CARD_SURFACE} 18%, transparent) 32%, color-mix(in oklab, ${PLAN_CARD_SURFACE} 72%, transparent) 62%, ${PLAN_CARD_SURFACE} 100%)`,
        }}
        aria-hidden
      />

      <div className="relative z-10 flex w-full min-w-0 flex-col p-3.5">
        <div className="flex w-full items-center gap-1">
          <span
            className={cn(
              "text-[10px] font-semibold tracking-[0.14em] uppercase",
              isBusiness ? "text-emerald-400" : "text-blue-400",
            )}
          >
            {t(`${variant}.badge`)}
          </span>
          {isBusiness ? (
            <Crown className="size-3 shrink-0 text-violet-400" strokeWidth={2} aria-hidden />
          ) : null}
        </div>

        <h3 className="mt-2 max-w-[65%] text-[13px] leading-snug font-semibold tracking-tight text-white">
          {t(`${variant}.title`)}
        </h3>
        <p className="mt-1 max-w-[65%] text-[11px] leading-relaxed text-slate-400">
          {t(`${variant}.body`)}
        </p>

        <ul className="mt-3 w-full space-y-1.5">
          {featureKeys.map((key) => (
            <li key={key} className="flex w-full items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                  isBusiness
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-blue-500/20 text-blue-400",
                )}
              >
                <Check className="size-2.5" strokeWidth={2.5} aria-hidden />
              </span>
              <span className="min-w-0 flex-1 text-[11px] leading-snug text-slate-300">
                {featureLabel(t, variant, key)}
              </span>
            </li>
          ))}
        </ul>

        {variant === "free" ? (
          <div className="mt-3.5 flex w-full flex-col gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 w-full rounded-lg border-white/15 bg-white/[0.08] text-[11px] font-medium text-white shadow-none hover:bg-white/12 hover:text-white"
            >
              <Link href={billingHref} className="w-full justify-center">
                {t("free.ctaPrimary")}
                <ArrowRight className="size-3.5" strokeWidth={2} />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 w-full rounded-lg border-white/10 bg-transparent text-[10px] font-medium text-slate-400 shadow-none hover:bg-white/[0.06] hover:text-slate-200"
            >
              <Link href={billingHref} className="w-full justify-center">
                {t("free.ctaSecondary")}
              </Link>
            </Button>
          </div>
        ) : null}

        {variant === "pro" ? (
          <Button
            asChild
            size="sm"
            className="mt-3.5 h-8 w-full rounded-lg border-0 bg-gradient-to-r from-violet-600 to-blue-600 text-[11px] font-medium text-white shadow-md shadow-violet-900/30 hover:from-violet-500 hover:to-blue-500"
          >
            <Link href={billingHref} className="w-full justify-center">
              {t("pro.ctaPrimary")}
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          </Button>
        ) : null}

        {isBusiness ? (
          <p className="mt-3.5 w-full rounded-full border border-violet-500/30 bg-violet-500/15 px-3 py-1.5 text-center text-[10px] font-medium leading-snug text-violet-200">
            {t("business.thankYou")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SidebarPlanCardCollapsedIcon({
  variant,
}: {
  variant: PlanCardVariant;
}) {
  if (variant === "business") {
    return <BadgeCheck className="size-4" strokeWidth={1.75} />;
  }
  return <Sparkles className="size-4" strokeWidth={1.75} />;
}
