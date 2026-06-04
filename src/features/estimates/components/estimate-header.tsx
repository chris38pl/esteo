"use client";

import { useTranslations } from "next-intl";
import type { EstimateVersionStatus } from "@prisma/client";
import { ChevronDown, Eye, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  estimateHeaderActionsDividerClassName,
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "./estimate-action-button-styles";
import { EstimateVersionSelector } from "./estimate-version-selector";
import { EstimateHeaderStatusBadge } from "./estimate-header-status-badge";
import { EstimateRulesIndicator } from "./estimate-rules-indicator";
import { EstimateHeaderPinMenuItem } from "./estimate-header-pin-menu-item";
import type { AutoSaveStatus } from "@/features/estimates/hooks/use-estimate-autosave";
import type { Locale } from "@/lib/locale";
import {
  estimateHeaderInlineActionButtonClass,
  estimateHeaderInlineActionMenuItemClass,
  estimateHeaderTitleClass,
} from "@/features/estimates/lib/estimate-header-layout";
import { cn } from "@/lib/utils";

const headerInlineActionButtonClassName = cn(
  estimateOutlineButtonClassName,
  estimateHeaderInlineActionButtonClass,
);

const headerMoreMenuInlineActionClassName = cn(
  "gap-2",
  estimateHeaderInlineActionMenuItemClass,
);

interface Version {
  id: string;
  versionNumber: number;
  status: EstimateVersionStatus;
}

interface EstimateHeaderProps {
  title?: string | null;
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  versions: Version[];
  activeVersionId: string;
  autosaveStatus: AutoSaveStatus;
  rulesApplied?: boolean;
  isPinned?: boolean;
}

export function EstimateHeader({
  title,
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  versions,
  activeVersionId,
  autosaveStatus,
  rulesApplied = true,
  isPinned = false,
}: EstimateHeaderProps) {
  const t = useTranslations("estimates");
  const activeVersion = versions.find((version) => version.id === activeVersionId) ?? versions[0];
  const activeVersionNumber = activeVersion?.versionNumber ?? 1;
  const activeStatus = activeVersion?.status ?? "DRAFT";
  const headerTitle = title ?? t("editor.titleEyebrow");

  return (
    <header className="flex min-w-0 flex-wrap items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className={estimateHeaderTitleClass}>
          {t("editor.titleWithVersion", {
            title: headerTitle,
            version: activeVersionNumber,
          })}
        </h1>
        <EstimateHeaderStatusBadge
          versionStatus={activeStatus}
          autosaveStatus={autosaveStatus}
        />
      </div>

      <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={headerInlineActionButtonClassName}
          >
            <Eye className="size-4" />
            {t("header.actions.preview")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={headerInlineActionButtonClassName}
          >
            <Share2 className="size-4" />
            {t("header.actions.share")}
          </Button>
          <Button type="button" size="sm" className={estimatePrimaryButtonClassName}>
            {t("header.actions.send")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={estimateOutlineButtonClassName}
              >
                {t("header.actions.more")}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <EstimateHeaderPinMenuItem
                estimateId={estimateId}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                locale={locale}
                isPinned={isPinned}
              />
              <DropdownMenuItem className={headerMoreMenuInlineActionClassName}>
                <Eye className="size-4" />
                {t("header.actions.preview")}
              </DropdownMenuItem>
              <DropdownMenuItem className={headerMoreMenuInlineActionClassName}>
                <Share2 className="size-4" />
                {t("header.actions.share")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          className={estimateHeaderActionsDividerClassName}
        />

        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <EstimateRulesIndicator
            workspaceSlug={workspaceSlug}
            locale={locale}
            rulesApplied={rulesApplied}
          />

          <EstimateVersionSelector
            estimateId={estimateId}
            workspaceId={workspaceId}
            versions={versions}
            activeVersionId={activeVersionId}
            locale={locale}
            workspaceSlug={workspaceSlug}
          />
        </div>
      </div>
    </header>
  );
}
