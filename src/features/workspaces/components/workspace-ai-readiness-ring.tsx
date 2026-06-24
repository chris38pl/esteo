"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ScoreTooltip({ side = "bottom" }: { side?: "bottom" | "top" | "right" | "left" }) {
  const t = useTranslations("workspaces.settings.aiSetup");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground md:min-h-0 md:min-w-0 md:p-0"
            aria-label={t("scoreHint")}
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {t("scoreHint")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function WorkspaceAiReadinessRing({ percent }: { percent: number }) {
  const t = useTranslations("workspaces.settings.aiSetup");
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <>
      <div className="flex w-full items-center gap-2 md:hidden">
        <ScoreTooltip side="top" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{t("scoreLabel")}</span>
            <span className="text-sm font-semibold tabular-nums text-primary">{clamped}%</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${t("scoreLabel")}: ${clamped}%`}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${clamped}%` }}
            />
          </div>
        </div>
      </div>

      <div className="hidden flex-col items-center gap-2 md:flex">
        <div className="relative size-32">
          <svg
            viewBox="0 0 128 128"
            className="size-full -rotate-90"
            role="img"
            aria-label={`${t("scoreLabel")}: ${clamped}%`}
          >
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/50"
            />
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="text-primary transition-[stroke-dashoffset] duration-500"
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-semibold tabular-nums text-foreground">{clamped}%</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <span>{t("scoreLabel")}</span>
          <ScoreTooltip />
        </div>
      </div>
    </>
  );
}
