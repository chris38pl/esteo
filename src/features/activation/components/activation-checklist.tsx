"use client";

import { Check, Circle, FileImage, FilePlus, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import {
  ActivationAnalyticsEvents,
  trackActivationEvent,
} from "@/features/activation/lib/activation-analytics";
import {
  hasActivationCompletedAnalyticsFired,
  markActivationCompletedAnalyticsFired,
  markCelebrationDismissed,
} from "@/features/activation/lib/activation-storage";
import type { ActivationStep } from "@/features/activation/lib/activation-types";
import type { ActivationStepId } from "@/features/activation/lib/activation-types";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const CHECKLIST_STEP_META: Record<
  ActivationStepId,
  {
    Icon: typeof FilePlus;
    ringClass: string;
    iconClass: string;
    buttonClassName: string;
  }
> = {
  create_estimate: {
    Icon: FilePlus,
    ringClass: "bg-blue-500/12 dark:bg-blue-400/15",
    iconClass: "text-blue-600 dark:text-blue-400",
    buttonClassName:
      "border-blue-300/90 bg-background text-blue-700 hover:bg-blue-50 dark:border-blue-700/60 dark:text-blue-300 dark:hover:bg-blue-950/40",
  },
  generate_pdf: {
    Icon: FileImage,
    ringClass: "bg-violet-500/12 dark:bg-violet-400/15",
    iconClass: "text-violet-600 dark:text-violet-400",
    buttonClassName:
      "border-violet-300/90 bg-background text-violet-700 hover:bg-violet-50 dark:border-violet-700/60 dark:text-violet-300 dark:hover:bg-violet-950/40",
  },
  share_form: {
    Icon: Link2,
    ringClass: "bg-emerald-500/12 dark:bg-emerald-400/15",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    buttonClassName:
      "border-emerald-300/90 bg-background text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700/60 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
  },
};

interface ActivationChecklistProps {
  workspaceSlug: string;
  locale: Locale;
  steps: ActivationStep[];
  isCelebrating: boolean;
  latestEstimateId: string | null;
  onCreateClick: () => void;
  onCopyFormLink: () => void;
  onCelebrationDismissed: () => void;
  embedded?: boolean;
}

function StepStatus({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <Check
        className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden
      />
    );
  }

  return (
    <Circle className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
  );
}

function ChecklistStepRow({
  index,
  step,
  label,
  ctaLabel,
  latestEstimateId,
  onCta,
}: {
  index: number;
  step: ActivationStep;
  label: string;
  ctaLabel: string;
  latestEstimateId: string | null;
  onCta: () => void;
}) {
  const meta = CHECKLIST_STEP_META[step.id];
  const { Icon, ringClass, iconClass, buttonClassName } = meta;
  const completed = step.completed;

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1.5 py-2.5 first:pt-0 last:pb-0",
        completed && "opacity-80",
      )}
    >
      <StepStatus completed={completed} />
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          ringClass,
        )}
      >
        <Icon className={cn("size-3.5 stroke-[1.75]", iconClass)} aria-hidden />
      </div>
      <p
        className={cn(
          "min-w-0 flex-1 text-xs leading-snug",
          completed ? "text-muted-foreground line-through" : "text-foreground",
        )}
      >
        <span className="font-medium">{index + 1}. </span>
        {label}
      </p>
      {!completed ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "h-7 shrink-0 rounded-md px-2 text-[11px] font-medium shadow-none xl:ml-auto",
            buttonClassName,
          )}
          onClick={onCta}
          disabled={step.id === "generate_pdf" && !latestEstimateId}
        >
          {ctaLabel}
        </Button>
      ) : null}
    </li>
  );
}

export function ActivationChecklist({
  workspaceSlug,
  locale,
  steps,
  isCelebrating,
  latestEstimateId,
  onCreateClick,
  onCopyFormLink,
  onCelebrationDismissed,
  embedded = false,
}: ActivationChecklistProps) {
  const t = useTranslations("activation.checklist");
  const router = useRouter();

  useEffect(() => {
    trackActivationEvent(ActivationAnalyticsEvents.checklistViewed, { workspaceSlug });
  }, [workspaceSlug]);

  useEffect(() => {
    const allComplete = steps.every((step) => step.completed);
    if (!allComplete || hasActivationCompletedAnalyticsFired(workspaceSlug)) {
      return;
    }
    markActivationCompletedAnalyticsFired(workspaceSlug);
    trackActivationEvent(ActivationAnalyticsEvents.completed, { workspaceSlug });
  }, [steps, workspaceSlug]);

  function handleStepCta(stepId: ActivationStepId) {
    trackActivationEvent(ActivationAnalyticsEvents.checklistCtaClicked, {
      workspaceSlug,
      stepId,
    });

    switch (stepId) {
      case "create_estimate":
        onCreateClick();
        return;
      case "generate_pdf":
        if (latestEstimateId) {
          router.push(
            `/${locale}/dashboard/${workspaceSlug}/estimates/${latestEstimateId}`,
          );
        }
        return;
      case "share_form":
        onCopyFormLink();
        return;
      default:
        return;
    }
  }

  function handleCelebrationDismiss() {
    markCelebrationDismissed(workspaceSlug);
    trackActivationEvent(ActivationAnalyticsEvents.celebrationDismissed, {
      workspaceSlug,
    });
    onCelebrationDismissed();
  }

  const checklistBody = isCelebrating ? (
    <div className="flex flex-1 flex-col justify-center space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {t("celebration.title")}
        </h2>
        <p className="text-xs text-muted-foreground">{t("celebration.descriptionLine1")}</p>
        <p className="text-xs text-muted-foreground">{t("celebration.descriptionLine2")}</p>
      </div>
      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={handleCelebrationDismiss}>
        {t("celebration.hide")}
      </Button>
    </div>
  ) : (
    <ul
      className={cn(
        "divide-y divide-border/50",
        embedded && "flex flex-1 flex-col justify-center",
      )}
    >
      {steps.map((step, index) => (
        <ChecklistStepRow
          key={step.id}
          index={index}
          step={step}
          label={t(`steps.${step.id}`)}
          ctaLabel={t(`cta.${step.id}`)}
          latestEstimateId={latestEstimateId}
          onCta={() => handleStepCta(step.id)}
        />
      ))}
    </ul>
  );

  const content = (
    <>
      {!isCelebrating ? (
        <h2 className="mb-4 shrink-0 text-xs font-semibold tracking-tight text-foreground md:text-sm">
          {t("title")}
        </h2>
      ) : null}
      {checklistBody}
    </>
  );

  if (embedded) {
    return <div className="flex h-full min-h-0 flex-col">{content}</div>;
  }

  return (
    <div className="surface-card space-y-3 p-4 md:p-5">
      {content}
    </div>
  );
}
