"use client";

import type { WorkspaceIndustry, WorkspaceRule } from "@prisma/client";
import { Brain, Check, Circle, Lightbulb, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { Button } from "@/components/ui/button";
import { useAiSetupCardDismissed } from "@/features/workspaces/hooks/use-ai-setup-card-dismissed";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import {
  useWorkspaceAiReadiness,
  type AiReadinessCriterionKey,
} from "@/features/workspaces/hooks/use-workspace-ai-readiness";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type WorkspaceAiSetupCardCompactProps = {
  workspaceIndustry: WorkspaceIndustry;
  industryOtherText: string;
  companyDescription: string;
  initialBranding: WorkspaceBranding | null;
  rules: WorkspaceRule[];
  locale: Locale;
  workspaceSlug: string;
};

const dismissButtonClassName =
  "inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground";

function configurationRulesHref(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/configuration?tab=rules`;
}

export function WorkspaceAiSetupCardCompact({
  workspaceIndustry,
  industryOtherText,
  companyDescription,
  initialBranding,
  rules,
  locale,
  workspaceSlug,
}: WorkspaceAiSetupCardCompactProps) {
  const t = useTranslations("workspaces.settings.aiSetup");
  const { currentUserId } = useWorkspaceContext();
  const { hasHydrated, isDismissed, dismiss } = useAiSetupCardDismissed(
    currentUserId,
    workspaceSlug,
  );
  const { readiness } = useWorkspaceAiReadiness({
    workspaceIndustry,
    industryOtherText,
    companyDescription,
    initialBranding,
    rules,
  });

  if (!isServiceWorkspace(workspaceIndustry)) {
    return null;
  }

  if (hasHydrated && isDismissed) {
    return null;
  }

  const criterionLabels: Record<AiReadinessCriterionKey, string> = {
    businessType: t("criteria.businessType"),
    companyDescription: t("criteria.companyDescription"),
    domainRulesOrRichDescription: t("criteria.workspaceRules"),
    customSections: t("criteria.customSections"),
  };

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-border/70 bg-card/60">
      <button
        type="button"
        onClick={dismiss}
        className={cn(dismissButtonClassName, "absolute top-2 right-2 z-10")}
        aria-label={t("dismiss")}
      >
        <X className="size-4" aria-hidden />
      </button>

      <div className="space-y-5 p-5 pr-14">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Brain className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base font-semibold">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{t("scoreLabel")}</span>
            <span className="text-sm font-semibold tabular-nums text-primary">
              {readiness.percent}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${readiness.percent}%` }}
            />
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {readiness.criteria.map((criterion) => (
            <li
              key={criterion.key}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              {criterion.met ? (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3" aria-hidden />
                </span>
              ) : (
                <Circle className="size-4 shrink-0 opacity-40" aria-hidden />
              )}
              <span className={cn(criterion.met && "text-foreground")}>
                {criterionLabels[criterion.key]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 bg-muted/25 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5 text-sm text-muted-foreground">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Lightbulb className="size-3.5" aria-hidden />
          </span>
          <span>{t("tip")}</span>
        </div>
        <Button size="default" className="shrink-0 rounded-md px-5" asChild>
          <Link href={configurationRulesHref(locale, workspaceSlug)}>{t("goToRules")}</Link>
        </Button>
      </div>
    </section>
  );
}
