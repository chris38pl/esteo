"use client";

import { useTranslations } from "next-intl";
import { RefreshCw, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { EstimateSummaryCardShell } from "./estimate-summary-card-shell";
import { EstimateSummarySectionHeader } from "./estimate-summary-section-header";

export function EstimateSummaryAiCard() {
  const t = useTranslations("estimates");

  return (
    <EstimateSummaryCardShell>
      <EstimateSummarySectionHeader
        icon={Sparkles}
        title={t("editor.summary.ai.title")}
        action={
          <Badge
            variant="outline"
            className="border-violet-500/30 bg-violet-500/10 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300"
          >
            {t("editor.summary.ai.generatedBadge")}
          </Badge>
        }
      />

      <div className="space-y-4 border-t border-border/60 px-5 py-4">
        <p className="text-sm leading-relaxed text-foreground">
          {t("editor.summary.ai.placeholder")}
        </p>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button type="button" variant="outline" size="sm" disabled className="gap-2">
                  <RefreshCw className="size-4" />
                  {t("editor.summary.ai.regenerate")}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("editor.summary.ai.regenerateSoon")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </EstimateSummaryCardShell>
  );
}
