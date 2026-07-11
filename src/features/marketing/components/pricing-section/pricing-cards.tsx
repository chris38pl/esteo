"use client";

import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type {
  PricingContent,
  PricingPlan,
} from "@/features/marketing/components/pricing-section/pricing-data";
import { trackMarketingEvent } from "@/features/marketing/lib/track-marketing-event";
import { useMarketingAuthCta } from "@/features/marketing/lib/use-marketing-auth-cta";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const planCardStyles: Record<
  PricingPlan["id"],
  {
    border: string;
    check: string;
    button: string;
  }
> = {
  FREE: {
    border: "border-border/60",
    check: "text-primary",
    button:
      "border-primary/35 bg-transparent text-primary hover:bg-primary/10 hover:text-primary dark:border-primary/40 dark:bg-transparent",
  },
  PRO: {
    border: "border-blue-500/35 shadow-[0_0_48px_-16px_rgba(59,130,246,0.55)]",
    check: "text-primary",
    button: "bg-blue-600 text-white hover:bg-blue-600/90",
  },
  BUSINESS: {
    border: "border-border/60",
    check: "text-amber-500",
    button: "bg-amber-500 text-slate-950 hover:bg-amber-500/90",
  },
};

function PricingFeatureGroups({
  groups,
  checkClassName,
}: {
  groups: string[][];
  checkClassName: string;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {groupIndex > 0 ? (
            <div className="mb-4 border-t border-border/40" aria-hidden />
          ) : null}
          <ul className="space-y-2.5">
            {group.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm leading-snug">
                <Check className={cn("mt-0.5 size-4 shrink-0", checkClassName)} aria-hidden />
                <span className="text-foreground/90">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PricingPlanCard({
  plan,
  locale,
  source,
}: {
  plan: PricingPlan;
  locale: Locale;
  source: string;
}) {
  const styles = planCardStyles[plan.id];
  const { resolvePrimaryCta } = useMarketingAuthCta(locale);
  const planCta = resolvePrimaryCta(
    {
      href: `/${locale}/sign-up`,
      label: plan.cta,
    },
    "goToApp",
  );

  return (
    <article
      className={cn(
        "relative flex h-full min-w-0 flex-col rounded-2xl border bg-card/50 p-6 sm:p-7",
        styles.border,
        plan.highlighted && "lg:z-[1] lg:-mt-3 lg:scale-[1.03] lg:px-7 lg:pb-8 lg:pt-9",
      )}
    >
      {plan.popularBadge ? (
        <span className="absolute left-1/2 top-0 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 px-3.5 py-1 text-center text-[10px] font-bold uppercase leading-snug tracking-[0.14em] text-white shadow-lg shadow-blue-600/30">
          {plan.popularBadge}
        </span>
      ) : null}

      <div className="flex flex-1 flex-col space-y-5">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{plan.name}</h3>
          <p className="text-pretty text-sm leading-snug text-muted-foreground">{plan.tagline}</p>
        </div>

        <div className="space-y-0.5">
          <p className="text-4xl font-semibold tracking-tight text-foreground">{plan.price}</p>
          <p className="text-sm text-muted-foreground">{plan.pricePeriod}</p>
        </div>

        <div className="border-t border-border/50 pt-5">
          <PricingFeatureGroups groups={plan.featureGroups} checkClassName={styles.check} />
        </div>
      </div>

      <div className="mt-7">
        <Button
          asChild
          variant={plan.id === "FREE" ? "outline" : "default"}
          className={cn("h-11 w-full rounded-lg text-sm font-semibold", styles.button)}
        >
          <Link
            href={planCta.href}
            onClick={() =>
              trackMarketingEvent("pricing_cta_clicked", {
                locale,
                plan: plan.id,
                source,
                cta: planCta.label,
              })
            }
          >
            {planCta.label}
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function PricingCards({
  content,
  locale,
  source = "landing",
}: {
  content: PricingContent;
  locale: Locale;
  source?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3 lg:items-stretch lg:gap-5 xl:gap-6">
      {content.plans.map((plan) => (
        <PricingPlanCard key={plan.id} plan={plan} locale={locale} source={source} />
      ))}
    </div>
  );
}
