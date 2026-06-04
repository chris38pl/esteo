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
import { EstimateAutosaveIndicator } from "./estimate-autosave-indicator";
import { EstimateRulesIndicator } from "./estimate-rules-indicator";
import type { AutoSaveStatus } from "@/features/estimates/hooks/use-estimate-autosave";

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
  locale: string;
  versions: Version[];
  activeVersionId: string;
  autosaveStatus: AutoSaveStatus;
  rulesApplied?: boolean;
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
}: EstimateHeaderProps) {
  const t = useTranslations("estimates");
  const activeVersion = versions.find((version) => version.id === activeVersionId) ?? versions[0];
  const activeVersionNumber = activeVersion?.versionNumber ?? 1;
  const activeStatus = activeVersion?.status ?? "DRAFT";
  const headerTitle = title ?? t("editor.titleEyebrow");

  return (
    <header className="flex min-w-0 flex-wrap items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="truncate text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
          {t("editor.titleWithVersion", {
            title: headerTitle,
            version: activeVersionNumber,
          })}
        </h1>
        <span className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {t(`header.status.${activeStatus}`)}
        </span>
        <EstimateAutosaveIndicator
          status={autosaveStatus}
          className="px-1"
        />
      </div>

      <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={estimateOutlineButtonClassName}
        >
          <Eye className="size-4" />
          {t("header.actions.preview")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={estimateOutlineButtonClassName}
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
            <DropdownMenuItem>{t("header.actions.morePlaceholder")}</DropdownMenuItem>
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
