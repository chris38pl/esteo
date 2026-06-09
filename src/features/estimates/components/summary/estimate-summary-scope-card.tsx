"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ClipboardList } from "lucide-react";

import type { VersionTreeClient } from "@/features/estimates/lib/serialize-estimate";
import { cn } from "@/lib/utils";

import { EstimateSummaryCardShell } from "./estimate-summary-card-shell";
import { EstimateSummarySectionHeader } from "./estimate-summary-section-header";

const COLLAPSED_SECTION_LIMIT = 6;

interface EstimateSummaryScopeCardProps {
  versionTree: VersionTreeClient | null;
}

export function EstimateSummaryScopeCard({ versionTree }: EstimateSummaryScopeCardProps) {
  const t = useTranslations("estimates");
  const [expanded, setExpanded] = useState(false);

  const sections = useMemo(
    () =>
      [...(versionTree?.sections ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [versionTree],
  );

  const visibleSections =
    expanded || sections.length <= COLLAPSED_SECTION_LIMIT
      ? sections
      : sections.slice(0, COLLAPSED_SECTION_LIMIT);

  const hasHiddenSections = sections.length > COLLAPSED_SECTION_LIMIT;

  return (
    <EstimateSummaryCardShell>
      <EstimateSummarySectionHeader
        icon={ClipboardList}
        title={t("editor.summary.scope.title")}
      />

      <div className="border-t border-border/60 px-5 py-4">
        {sections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("editor.summary.scope.empty")}</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {visibleSections.map((section) => {
                const index = sections.findIndex((entry) => entry.id === section.id);

                return (
                  <span
                    key={section.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm text-foreground"
                  >
                    <span className="text-xs font-semibold text-muted-foreground">
                      {index + 1}.
                    </span>
                    {section.title}
                  </span>
                );
              })}
            </div>

            {hasHiddenSections ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {expanded
                  ? t("editor.summary.scope.showLess")
                  : t("editor.summary.scope.showMore")}
                <ChevronDown
                  className={cn("size-4 transition-transform", expanded && "rotate-180")}
                />
              </button>
            ) : null}
          </>
        )}
      </div>
    </EstimateSummaryCardShell>
  );
}
