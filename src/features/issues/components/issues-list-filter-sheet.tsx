"use client";

import { useState } from "react";
import type { IssueStatus } from "@prisma/client";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import {
  EMPTY_ISSUES_LIST_FILTER,
  ISSUE_LIST_STATUS_VALUES,
  countMatchingIssues,
  type IssueTypeCategory,
  type IssuesListDateRange,
  type IssuesListFilterState,
} from "@/features/issues/lib/issues-list-filter";
import type { AdminIssueListItem } from "@/features/issues/server/repository";
import { cn } from "@/lib/utils";

const TYPE_CATEGORIES: IssueTypeCategory[] = ["all", "defect", "feature"];

export function IssuesListFilterSheet({
  open,
  onOpenChange,
  issues,
  searchQuery,
  appliedDateRange,
  appliedFilter,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: AdminIssueListItem[];
  searchQuery: string;
  appliedDateRange: IssuesListDateRange;
  appliedFilter: IssuesListFilterState;
  onApply: (filter: IssuesListFilterState) => void;
}) {
  const t = useTranslations("issues");
  const isMobile = useEstimateMobileLayout();
  const [draft, setDraft] = useState<IssuesListFilterState>(appliedFilter);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(appliedFilter);
    }
    onOpenChange(nextOpen);
  }

  const matchCount = countMatchingIssues(issues, {
    searchQuery,
    filter: draft,
    dateRange: appliedDateRange,
  });

  function toggleStatus(status: IssueStatus) {
    setDraft((current) => {
      const exists = current.statuses.includes(status);
      return {
        ...current,
        statuses: exists
          ? current.statuses.filter((value) => value !== status)
          : [...current.statuses, status],
      };
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 p-0",
          isMobile ? "h-[min(92dvh,40rem)] rounded-t-2xl" : "w-full max-w-md",
        )}
      >
        <SheetHeader className="border-b border-border/60 px-4 py-4 text-left">
          <SheetTitle>{t("list.filter.title")}</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <section className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">{t("list.filter.statusTitle")}</p>
            <div className="flex flex-wrap gap-2">
              {ISSUE_LIST_STATUS_VALUES.map((status) => {
                const selected = draft.statuses.includes(status);
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleStatus(status)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                      "border-input bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground",
                      selected && "border-primary/50 bg-primary/10 text-foreground",
                    )}
                  >
                    {t(`status.${status}`)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">{t("list.filter.typeTitle")}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TYPE_CATEGORIES.map((category) => {
                const selected = draft.typeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setDraft((current) => ({ ...current, typeCategory: category }))}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                      "border-input bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground",
                      selected && "border-primary/50 bg-primary/10 text-foreground",
                    )}
                  >
                    {t(`list.filter.typeCategory.${category}`)}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <SheetFooter className="flex-row gap-2 border-t border-border/60 px-4 py-4">
          <Button
            type="button"
            variant="outline"
            className={estimateOutlineButtonClassName}
            onClick={() => setDraft(EMPTY_ISSUES_LIST_FILTER)}
          >
            {t("list.filter.clear")}
          </Button>
          <Button
            type="button"
            className={cn("flex-1", estimatePrimaryButtonClassName)}
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
          >
            {t("list.filter.showResults", { count: matchCount })}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
