"use client";



import Link from "next/link";

import { ShieldCheck } from "lucide-react";

import { useTranslations } from "next-intl";



import { Badge } from "@/components/ui/badge";

import {

  Tooltip,

  TooltipContent,

  TooltipProvider,

  TooltipTrigger,

} from "@/components/ui/tooltip";



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

          <Link

            href={`/${locale}/dashboard/${workspaceSlug}/settings?tab=rules`}

            className="inline-flex"

          >

            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary/80">

              <ShieldCheck className="size-3" />

              {t("rules.applied")}

            </Badge>

          </Link>

        </TooltipTrigger>

        <TooltipContent>{t("rules.tooltip")}</TooltipContent>

      </Tooltip>

    </TooltipProvider>

  );

}

