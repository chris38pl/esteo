"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEstimateRulesLabelVisible } from "@/features/estimates/hooks/use-estimate-rules-label-visible";
import { cn } from "@/lib/utils";
import { estimateOutlineButtonClassName } from "./estimate-action-button-styles";

interface EstimateRulesIndicatorProps {
  workspaceSlug: string;
  locale: string;
  rulesApplied?: boolean;
}

export function EstimateRulesIndicator({
  workspaceSlug,
  locale,
  rulesApplied = true,
}: EstimateRulesIndicatorProps) {
  const t = useTranslations("estimates");
  const isLabelVisible = useEstimateRulesLabelVisible();

  if (!rulesApplied) return null;

  const control = (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={cn("estimate-rules-indicator", estimateOutlineButtonClassName)}
    >
      <Link
        href={`/${locale}/dashboard/${workspaceSlug}/settings?tab=rules`}
        className="inline-flex items-center justify-center gap-2"
        aria-label={!isLabelVisible ? t("rules.applied") : undefined}
      >
        <ShieldCheck className="size-4 shrink-0" />
        <span className="estimate-rules-indicator__label">{t("rules.applied")}</span>
      </Link>
    </Button>
  );

  if (isLabelVisible) {
    return control;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent side="bottom">{t("rules.applied")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
