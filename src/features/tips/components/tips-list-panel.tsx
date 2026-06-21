"use client";

import { Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { TipCard } from "@/features/tips/components/tip-card";
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
  const { currentUserId } = useWorkspaceContext();
  const { pinnedIds, togglePin } = useTipsStorageState(currentUserId, workspaceSlug);

  function handlePinToggle(tipId: (typeof TIPS_CATALOG)[number]["id"]) {
    const result = togglePin(tipId);
    if (result === "max_reached") {
      toast.message(t("pin.maxReached"));
    }
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-6xl flex-1 flex-col gap-8 pb-8">
      <header className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-500/12 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:ring-amber-400/15">
          <Lightbulb className="size-6 text-amber-600 dark:text-amber-400" aria-hidden />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("page.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("page.subtitle")}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TIPS_CATALOG.map((tip) => {
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
    </div>
  );
}
