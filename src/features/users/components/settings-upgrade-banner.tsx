"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import type { BillingSidebarState } from "@/features/billing/billing-sidebar-state";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLAN_IMAGE = "/sidebar/free-plan-image.png";
const BANNER_SURFACE = "#091224";

function shouldShowUpgrade(state: BillingSidebarState) {
  return state.variant === "upsell" && state.currentPlan === "FREE";
}

export function SettingsUpgradeBanner() {
  const t = useTranslations("sidebar.planCards");
  const { billingSidebarState, locale } = useWorkspaceContext();

  if (!shouldShowUpgrade(billingSidebarState)) {
    return null;
  }

  const billingHref = dashboardBillingHref(locale);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border border-border/60",
        "bg-[#091224] text-slate-300",
      )}
      style={{ backgroundColor: BANNER_SURFACE }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-y-0 right-0 w-[min(42%,280px)]">
          <Image
            src={PLAN_IMAGE}
            alt=""
            fill
            sizes="280px"
            className="object-contain object-right"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #091224 0%, #091224 45%, color-mix(in oklab, #091224 40%, transparent) 70%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
        <div className="max-w-xl space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
            {t("free.title")}
          </h2>
          <p className="text-sm leading-relaxed text-slate-400">{t("free.body")}</p>
        </div>

        <Button
          asChild
          variant="outline"
          className="shrink-0 rounded-lg border-white/15 bg-white/[0.08] text-white hover:bg-white/12 hover:text-white"
        >
          <Link href={billingHref}>
            {t("free.ctaPrimary")}
            <ArrowRight className="size-4" strokeWidth={2} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
