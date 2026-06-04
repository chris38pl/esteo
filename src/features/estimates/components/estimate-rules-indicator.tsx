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

  if (!rulesApplied) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="outline"
            size="sm"
            className={estimateOutlineButtonClassName}
          >
            <Link href={`/${locale}/dashboard/${workspaceSlug}/settings?tab=rules`}>
              <ShieldCheck className="size-4 shrink-0" />
              {t("rules.applied")}
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("rules.tooltip")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
