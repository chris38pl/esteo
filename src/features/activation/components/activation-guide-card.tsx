"use client";

import { ArrowRight, FileCheck, FileText, Sparkles } from "lucide-react";
import { Fragment } from "react";
import { useTranslations } from "next-intl";

import type { ActivationGuideMode } from "@/features/activation/lib/activation-types";
import type { WorkspaceIndustry } from "@prisma/client";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface ActivationGuideCardProps {
  mode: ActivationGuideMode;
  industry: WorkspaceIndustry;
  locale: Locale;
  embedded?: boolean;
}

const HOW_IT_WORKS_STEPS = [
  {
    id: "step1",
    Icon: FileText,
    ringClass: "bg-amber-500/12 dark:bg-amber-400/15",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "step2",
    Icon: Sparkles,
    ringClass: "bg-violet-500/12 dark:bg-violet-400/15",
    iconClass: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "step3",
    Icon: FileCheck,
    ringClass: "bg-emerald-500/12 dark:bg-emerald-400/15",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
] as const;

function HowItWorksIcon({
  Icon,
  ringClass,
  iconClass,
}: {
  Icon: typeof FileText;
  ringClass: string;
  iconClass: string;
}) {
  return (
    <div
      className={cn(
        "flex size-14 items-center justify-center rounded-full sm:size-16",
        ringClass,
      )}
    >
      <Icon className={cn("size-6 stroke-[1.5] sm:size-7", iconClass)} aria-hidden />
    </div>
  );
}

function HowItWorksConnector({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center text-muted-foreground/55",
        vertical ? "py-0.5" : "px-1.5 lg:px-3",
      )}
    >
      <ArrowRight
        className={cn("size-5 stroke-[1.75] lg:size-6", vertical && "rotate-90")}
      />
    </div>
  );
}

export function ActivationGuideCard({
  mode,
  industry: _industry,
  locale: _locale,
  embedded = false,
}: ActivationGuideCardProps) {
  const t = useTranslations("activation.guide");

  const stepTexts = [
    t("howItWorks.step1"),
    t("howItWorks.step2"),
    t("howItWorks.step3"),
  ];

  const howItWorksContent = (
    <>
      <h2 className="shrink-0 text-sm font-semibold tracking-tight text-foreground md:text-base">
        {t("howItWorksTitle")}
      </h2>

      {/* Desktop: icons + arrows on one row (centered), texts below */}
      <div className="mt-6 hidden sm:block">
        <div className="flex items-center justify-center">
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const { Icon, ringClass, iconClass } = step;

            return (
              <Fragment key={step.id}>
                <div className="flex flex-1 justify-center">
                  <HowItWorksIcon Icon={Icon} ringClass={ringClass} iconClass={iconClass} />
                </div>
                {index < HOW_IT_WORKS_STEPS.length - 1 ? <HowItWorksConnector /> : null}
              </Fragment>
            );
          })}
        </div>

        <div className="mt-3 flex">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <p
              key={step.id}
              className="flex-1 px-1 text-center text-xs leading-snug text-muted-foreground lg:px-2"
            >
              <span className="font-medium text-foreground">{index + 1}. </span>
              {stepTexts[index]}
            </p>
          ))}
        </div>
      </div>

      {/* Mobile: stacked steps with centered arrows between */}
      <ol className="mt-4 flex list-none flex-col items-center gap-3 p-0 sm:hidden">
        {HOW_IT_WORKS_STEPS.map((step, index) => {
          const { Icon, ringClass, iconClass } = step;

          return (
            <li key={step.id} className="flex w-full flex-col items-center gap-3">
              <HowItWorksIcon Icon={Icon} ringClass={ringClass} iconClass={iconClass} />
              <p className="max-w-xs text-center text-xs leading-snug text-muted-foreground">
                <span className="font-medium text-foreground">{index + 1}. </span>
                {stepTexts[index]}
              </p>
              {index < HOW_IT_WORKS_STEPS.length - 1 ? (
                <HowItWorksConnector vertical />
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );

  if (embedded) {
    return <div className="space-y-0">{howItWorksContent}</div>;
  }

  return (
    <div className="surface-card space-y-4 p-4 md:p-5 lg:p-6">
      {howItWorksContent}
    </div>
  );
}
