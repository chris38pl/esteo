"use client";

import type { WorkspaceIndustry, WorkspaceRule } from "@prisma/client";
import { Check, ChevronRight, Circle } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { WorkspaceAiReadinessRing } from "@/features/workspaces/components/workspace-ai-readiness-ring";
import { aiSetupFocusHref } from "@/features/workspaces/lib/ai-setup-focus";
import { isServiceWorkspace } from "@/features/workspaces/lib/industries";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import {
  useWorkspaceAiReadiness,
  type AiReadinessCriterionKey,
} from "@/features/workspaces/hooks/use-workspace-ai-readiness";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type WorkspaceAiSetupCardDetailedProps = {
  workspaceIndustry: WorkspaceIndustry;
  industryOtherText: string;
  companyDescription: string;
  initialBranding: WorkspaceBranding | null;
  rules: WorkspaceRule[];
  locale: Locale;
  workspaceSlug: string;
};

type CriterionNavigation = {
  href: string;
  actionLabel: string;
};

function settingsHref(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/settings`;
}

function configurationRulesHref(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/configuration?tab=rules`;
}

export function WorkspaceAiSetupCardDetailed({
  workspaceIndustry,
  industryOtherText,
  companyDescription,
  initialBranding,
  rules,
  locale,
  workspaceSlug,
}: WorkspaceAiSetupCardDetailedProps) {
  const t = useTranslations("workspaces.settings.aiSetup");
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

  const criterionLabels: Record<AiReadinessCriterionKey, string> = {
    businessType: t("criteria.businessType"),
    companyDescription: t("criteria.companyDescription"),
    domainRulesOrRichDescription: t("criteria.workspaceRules"),
    customSections: t("criteria.customSections"),
  };

  function resolveNavigation(criterionKey: AiReadinessCriterionKey, met: boolean): CriterionNavigation {
    if (met) {
      return { href: "#", actionLabel: t("actions.completed") };
    }

    switch (criterionKey) {
      case "businessType":
        return {
          href: aiSetupFocusHref(settingsHref(locale, workspaceSlug), "businessType"),
          actionLabel: t("actions.complete"),
        };
      case "companyDescription":
        return {
          href: aiSetupFocusHref(settingsHref(locale, workspaceSlug), "companyDescription"),
          actionLabel: t("actions.complete"),
        };
      case "domainRulesOrRichDescription":
        return {
          href: aiSetupFocusHref(configurationRulesHref(locale, workspaceSlug), "estimateRules"),
          actionLabel: t("actions.addRules"),
        };
      case "customSections":
        return {
          href: aiSetupFocusHref(configurationRulesHref(locale, workspaceSlug), "estimateSections"),
          actionLabel: t("actions.customize"),
        };
      default:
        return { href: "#", actionLabel: t("actions.complete") };
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-border/70 bg-card/60 p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] lg:items-start">
        <div className="flex w-full justify-center md:justify-start">
          <WorkspaceAiReadinessRing percent={readiness.percent} />
        </div>

        <div className="min-w-0 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>

          <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
            {readiness.criteria.map((criterion) => {
              const navigation = resolveNavigation(criterion.key, criterion.met);
              const rowContent = (
                <>
                  <div className="flex min-w-0 items-center gap-3">
                    {criterion.met ? (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <Check className="size-3" aria-hidden />
                      </span>
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        criterion.met ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {criterionLabels[criterion.key]}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "text-sm font-medium whitespace-nowrap",
                        criterion.met ? "text-emerald-600 dark:text-emerald-400" : "text-primary",
                      )}
                    >
                      {navigation.actionLabel}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                </>
              );

              if (criterion.met) {
                return (
                  <li
                    key={criterion.key}
                    className="flex items-center justify-between gap-4 px-4 py-3.5"
                  >
                    {rowContent}
                  </li>
                );
              }

              return (
                <li key={criterion.key}>
                  <Link
                    href={navigation.href}
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-muted/30"
                  >
                    {rowContent}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
