"use client";

import type { EstimateVersionStatus } from "@prisma/client";
import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AutoSaveStatus } from "@/features/estimates/hooks/use-estimate-autosave";
import { cn } from "@/lib/utils";
import { ESTIMATE_LAYOUT_CONFIG } from "@/features/estimates/lib/estimate-layout-config";
import { estimateHeaderStatusBadgeClassName } from "./estimate-action-button-styles";

export const ESTIMATE_HEADER_STATUS_BADGE_MIN_WIDTH =
  ESTIMATE_LAYOUT_CONFIG.tailwind.headerStatusBadgeMinWidth;

interface EstimateHeaderStatusBadgeProps {
  versionStatus: EstimateVersionStatus;
  autosaveStatus: AutoSaveStatus;
}

export function EstimateHeaderStatusBadge({
  versionStatus,
  autosaveStatus,
}: EstimateHeaderStatusBadgeProps) {
  const t = useTranslations("estimates");

  const versionLabel = t(`header.status.${versionStatus}`);

  if (autosaveStatus === "idle") {
    return (
      <span
        className={cn(
          estimateHeaderStatusBadgeClassName,
          ESTIMATE_HEADER_STATUS_BADGE_MIN_WIDTH,
          "shrink-0 text-center text-muted-foreground",
        )}
      >
        {versionLabel}
      </span>
    );
  }

  const autosaveConfig: Record<
    Exclude<AutoSaveStatus, "idle">,
    { label: string; icon: React.ElementType; iconClass: string; badgeClass: string }
  > = {
    saving: {
      label: t("autosave.saving"),
      icon: Loader2,
      iconClass: "animate-spin text-muted-foreground",
      badgeClass: "text-muted-foreground",
    },
    saved: {
      label: t("autosave.saved"),
      icon: Check,
      iconClass: "text-green-600 dark:text-green-400",
      badgeClass: "text-green-700 dark:text-green-400",
    },
    error: {
      label: t("autosave.error"),
      icon: AlertCircle,
      iconClass: "text-destructive",
      badgeClass: "text-destructive",
    },
    conflict: {
      label: t("autosave.conflict"),
      icon: RefreshCw,
      iconClass: "text-amber-600 dark:text-amber-400",
      badgeClass: "text-amber-700 dark:text-amber-400",
    },
  };

  const { label, icon: Icon, iconClass, badgeClass } = autosaveConfig[autosaveStatus];

  return (
    <span
      className={cn(
        estimateHeaderStatusBadgeClassName,
        ESTIMATE_HEADER_STATUS_BADGE_MIN_WIDTH,
        "shrink-0 text-center",
        badgeClass,
      )}
    >
      <Icon className={iconClass} />
      <span>{label}</span>
    </span>
  );
}
