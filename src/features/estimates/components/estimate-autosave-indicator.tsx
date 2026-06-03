"use client";



import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";

import { useTranslations } from "next-intl";



import { cn } from "@/lib/utils";

import type { AutoSaveStatus } from "@/features/estimates/hooks/use-estimate-autosave";



interface EstimateAutosaveIndicatorProps {

  status: AutoSaveStatus;

  className?: string;

}



export function EstimateAutosaveIndicator({

  status,

  className,

}: EstimateAutosaveIndicatorProps) {

  const t = useTranslations("estimates");



  const config: Record<

    AutoSaveStatus,

    { icon: React.ElementType; label: string; className: string }

  > = {

    idle: { icon: Check, label: "", className: "text-muted-foreground opacity-0" },

    saving: {

      icon: Loader2,

      label: t("autosave.saving"),

      className: "text-muted-foreground animate-spin",

    },

    saved: {

      icon: Check,

      label: t("autosave.saved"),

      className: "text-green-600 dark:text-green-400",

    },

    error: {

      icon: AlertCircle,

      label: t("autosave.error"),

      className: "text-destructive",

    },

    conflict: {

      icon: RefreshCw,

      label: t("autosave.conflict"),

      className: "text-amber-600 dark:text-amber-400",

    },

  };



  const { icon: Icon, label, className: iconClass } = config[status];



  return (

    <span

      className={cn(

        "inline-flex items-center gap-1 text-xs transition-opacity",

        className,

      )}

    >

      <Icon className={cn("size-3", iconClass)} />

      {label && <span className={iconClass}>{label}</span>}

    </span>

  );

}

