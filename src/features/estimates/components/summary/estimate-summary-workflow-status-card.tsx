"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Check, Send } from "lucide-react";

import type { EstimateForEditorClient, VersionTreeClient } from "@/features/estimates/lib/serialize-estimate";
import type { EstimateActivityLogClient } from "@/features/estimates/lib/serialize-estimate-activity";
import {
  deriveEstimateWorkflowStatus,
  type WorkflowStep,
  type WorkflowStepId,
} from "@/features/estimates/lib/derive-estimate-workflow-status";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import { EstimateSummaryCardShell } from "./estimate-summary-card-shell";

interface EstimateSummaryWorkflowStatusCardProps {
  estimate: EstimateForEditorClient;
  versionTree: VersionTreeClient | null;
  activityLogs: EstimateActivityLogClient[];
  locale: Locale;
}

function formatStepDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function StepIcon({ step }: { step: WorkflowStep }) {
  if (step.state === "completed") {
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="size-4" />
      </span>
    );
  }

  if (step.state === "current") {
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Send className="size-3.5" />
      </span>
    );
  }

  return (
    <span className="flex size-8 items-center justify-center rounded-full border-2 border-neutral-400 bg-neutral-100 dark:border-muted-foreground/35 dark:bg-background" />
  );
}

function stepLabels(
  stepId: WorkflowStepId,
  t: ReturnType<typeof useTranslations<"estimates">>,
): { title: string; description: string } {
  switch (stepId) {
    case "inquiry":
      return {
        title: t("editor.summary.workflow.inquiry"),
        description: t("editor.summary.workflow.inquiryDesc"),
      };
    case "estimate":
      return {
        title: t("editor.summary.workflow.estimate"),
        description: t("editor.summary.workflow.estimateDesc"),
      };
    case "sent":
      return {
        title: t("editor.summary.workflow.sent"),
        description: t("editor.summary.workflow.sentDesc"),
      };
    case "negotiations":
      return {
        title: t("editor.summary.workflow.negotiations"),
        description: t("editor.summary.workflow.negotiationsDesc"),
      };
    case "acceptance":
      return {
        title: t("editor.summary.workflow.acceptance"),
        description: t("editor.summary.workflow.acceptanceDesc"),
      };
  }
}

export function EstimateSummaryWorkflowStatusCard({
  estimate,
  versionTree,
  activityLogs,
  locale,
}: EstimateSummaryWorkflowStatusCardProps) {
  const t = useTranslations("estimates");

  const lineItemCount = useMemo(
    () =>
      versionTree?.sections.reduce(
        (count, section) => count + section.lineItems.length,
        0,
      ) ?? 0,
    [versionTree],
  );

  const workflow = useMemo(
    () =>
      deriveEstimateWorkflowStatus({
        hasEstimateRequest: estimate.estimateRequest != null,
        estimateRequestCreatedAt: estimate.estimateRequest?.createdAt ?? null,
        versionCreatedAt: versionTree?.createdAt ?? estimate.createdAt,
        versionUpdatedAt: versionTree?.updatedAt ?? estimate.updatedAt,
        versionNumber: versionTree?.versionNumber ?? 1,
        versionStatus: versionTree?.status ?? "DRAFT",
        lineItemCount,
        activityLogs,
      }),
    [
      activityLogs,
      estimate.createdAt,
      estimate.estimateRequest,
      estimate.updatedAt,
      lineItemCount,
      versionTree,
    ],
  );

  return (
    <EstimateSummaryCardShell>
      <div className="px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {t("editor.summary.workflow.titleWithVersion", {
            n: versionTree?.versionNumber ?? 1,
          })}
        </p>

        <ol className="mt-4 space-y-0">
          {workflow.steps.map((step, index) => {
            const labels = stepLabels(step.id, t);
            const isLast = index === workflow.steps.length - 1;
            const connectorCompleted = step.state === "completed";

            return (
              <li key={step.id} className="grid grid-cols-[2rem_1fr_auto] gap-x-3">
                <div className="flex flex-col items-center">
                  <StepIcon step={step} />
                  {!isLast ? (
                    <span
                      className={cn(
                        "my-1 w-0 flex-1 min-h-6 self-center border-l-2 border-dashed",
                        connectorCompleted
                          ? "border-emerald-500/70 dark:border-emerald-500/50"
                          : step.state === "current"
                            ? "border-primary/70 dark:border-primary/40"
                            : "border-neutral-400 dark:border-muted-foreground/30",
                      )}
                    />
                  ) : null}
                </div>

                <div className={cn("pb-5", isLast && "pb-0")}>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      step.state === "completed" && "text-emerald-600 dark:text-emerald-400",
                      step.state === "current" && "text-foreground",
                      step.state === "pending" && "text-foreground",
                    )}
                  >
                    {labels.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {labels.description}
                  </p>
                </div>

                <div className={cn("pb-5 text-right", isLast && "pb-0")}>
                  {step.completedAt ? (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatStepDate(step.completedAt, locale)}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </EstimateSummaryCardShell>
  );
}
