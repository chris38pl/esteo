"use client";

import { useTranslations } from "next-intl";
import type { EstimateVersionStatus } from "@prisma/client";
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

  return (
    <header className="flex flex-wrap items-center gap-3 border-b pb-4">
      <h1 className="text-lg font-semibold truncate flex-1">
        {title ?? t("editor.untitled")}
      </h1>

      <div className="flex items-center gap-2">
        <EstimateVersionSelector
          estimateId={estimateId}
          workspaceId={workspaceId}
          versions={versions}
          activeVersionId={activeVersionId}
          locale={locale}
          workspaceSlug={workspaceSlug}
        />

        <EstimateAutosaveIndicator status={autosaveStatus} />

        <EstimateRulesIndicator
          workspaceSlug={workspaceSlug}
          locale={locale}
          rulesApplied={rulesApplied}
        />
      </div>
    </header>
  );
}
