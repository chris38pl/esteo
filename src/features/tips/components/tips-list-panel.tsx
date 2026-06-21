"use client";

import { Lightbulb, MessageSquarePlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { Button } from "@/components/ui/button";
import { ReportIssueDialog } from "@/features/issues/components/report-issue-dialog";
import { TipCard } from "@/features/tips/components/tip-card";
import {
  TipsCategoryFilterBar,
  type TipsFilterCategory,
} from "@/features/tips/components/tips-category-filter-bar";
import { useTipsStorageState } from "@/features/tips/hooks/use-tips-storage-state";
import { TIP_CARD_STYLES } from "@/features/tips/lib/tip-card-styles";
import { getTipHref, TIPS_CATALOG } from "@/features/tips/lib/tips-catalog";
import type { Locale } from "@/lib/locale";

interface TipsListPanelProps {
  locale: Locale;
  workspaceSlug: string;
}

export function TipsListPanel({ locale, workspaceSlug }: TipsListPanelProps) {
  const t = useTranslations("tips");
  const { currentUserId, issueTrackerEnabled } = useWorkspaceContext();
  const { pinnedIds, togglePin } = useTipsStorageState(currentUserId, workspaceSlug);
  const [reportOpen, setReportOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TipsFilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  function handlePinToggle(tipId: (typeof TIPS_CATALOG)[number]["id"]) {
    const result = togglePin(tipId);
    if (result === "max_reached") {
      toast.message(t("pin.maxReached"));
    }
  }

  const filteredTips = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return TIPS_CATALOG.filter((tip) => {
      if (activeCategory !== "all" && tip.categoryId !== activeCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const title = t(`cards.${tip.id}.title`).toLowerCase();
      const description = t(`cards.${tip.id}.description`).toLowerCase();
      const category = t(`categories.${tip.categoryId}`).toLowerCase();

      return (
        title.includes(query) ||
        description.includes(query) ||
        category.includes(query)
      );
    });
  }, [activeCategory, searchQuery, t]);

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-6xl flex-1 flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <header className="flex min-w-0 items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-500/12 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:ring-amber-400/15">
            <Lightbulb className="size-6 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("page.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("page.subtitle")}
            </p>
          </div>
        </header>

        {issueTrackerEnabled ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 gap-2 self-start rounded-lg border-border/70 bg-background/40 px-4 text-sm font-medium lg:mt-1"
            onClick={() => setReportOpen(true)}
          >
            <MessageSquarePlus className="size-4 shrink-0 opacity-80" aria-hidden />
            {t("page.suggestTopic")}
          </Button>
        ) : null}
      </div>

      <TipsCategoryFilterBar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      {filteredTips.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("page.noResults")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTips.map((tip) => {
            const isPinned = pinnedIds.includes(tip.id);

            return (
              <TipCard
                key={tip.id}
                title={t(`cards.${tip.id}.title`)}
                description={t(`cards.${tip.id}.description`)}
                learnMoreLabel={t("learnMore")}
                href={getTipHref(tip.id, locale, workspaceSlug)}
                style={TIP_CARD_STYLES[tip.id]}
                categoryLabel={t(`categories.${tip.categoryId}`)}
                showCategory
                isPinned={isPinned}
                pinnedBadgeLabel={isPinned ? t("card.pinnedBadge") : undefined}
                onPinToggle={() => handlePinToggle(tip.id)}
                pinLabel={t("card.pin")}
                unpinLabel={t("card.unpin")}
              />
            );
          })}
        </div>
      )}

      {issueTrackerEnabled ? (
        <ReportIssueDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          locale={locale}
          workspaceSlug={workspaceSlug}
          presetType="TIP_SUGGESTION"
        />
      ) : null}
    </div>
  );
}
