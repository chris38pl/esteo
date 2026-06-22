"use client";

import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { Button } from "@/components/ui/button";
import { ReportIssueDialog } from "@/features/issues/components/report-issue-dialog";
import { TipsCarousel } from "@/features/tips/components/tips-carousel";
import { useTipsStorageState } from "@/features/tips/hooks/use-tips-storage-state";
import {
  buildTipsCarouselSlides,
  countTipsInSlides,
} from "@/features/tips/lib/build-tips-carousel-slides";
import { TIPS_BANNER_CATALOG } from "@/features/tips/lib/tips-catalog";
import { dashboardTipsHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface ActivationTipsBannerProps {
  workspaceSlug: string;
  locale: Locale;
  preview?: boolean;
  onDismissed?: () => void;
}

export function ActivationTipsBanner({
  workspaceSlug,
  locale,
  preview = false,
  onDismissed,
}: ActivationTipsBannerProps) {
  const tBanner = useTranslations("tips.banner");
  const { issueTrackerEnabled, currentUserId } = useWorkspaceContext();
  const [reportOpen, setReportOpen] = useState(false);
  const {
    dismissedIds,
    pinnedIds,
    isBannerDismissedForSession,
    togglePin,
    dismissTip,
    dismissBannerForSession,
  } = useTipsStorageState(preview ? null : currentUserId, workspaceSlug);

  const slides = buildTipsCarouselSlides(TIPS_BANNER_CATALOG, {
    pinnedIds: preview ? [] : pinnedIds,
    dismissedIds: preview ? [] : dismissedIds,
  });

  if (!preview && isBannerDismissedForSession) {
    return null;
  }

  if (!preview && countTipsInSlides(slides) === 0) {
    return null;
  }

  function handleDismiss() {
    if (!preview) {
      dismissBannerForSession();
    }
    onDismissed?.();
  }

  const tipsPageHref = dashboardTipsHref(locale, workspaceSlug);

  const dismissButtonClassName =
    "inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground";

  return (
    <>
      <section className="surface-card overflow-hidden rounded-t-xl rounded-b-lg border border-border/60">
        <div className="p-4 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 sm:hidden">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/12 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:ring-amber-400/15">
                    <Lightbulb
                      className="size-4 text-amber-600 dark:text-amber-400"
                      aria-hidden
                    />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {tBanner("title")}
                  </h2>
                </div>
                <div className="flex shrink-0 items-center">
                  <Link
                    href={tipsPageHref}
                    className={dismissButtonClassName}
                    aria-label={tBanner("seeAll")}
                  >
                    <BookOpen className="size-4" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className={dismissButtonClassName}
                    aria-label={tBanner("dismiss")}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="hidden min-w-0 items-start gap-3 sm:flex">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/12 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:ring-amber-400/15">
                  <Lightbulb
                    className="size-5 text-amber-600 dark:text-amber-400"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {tBanner("title")}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {tBanner("subtitle")}
                  </p>
                </div>
              </div>

              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:hidden">
                {tBanner("subtitle")}
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-2 self-start sm:flex sm:pt-0.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-lg border-border/70 bg-background/40 px-3 text-sm"
                asChild
              >
                <Link href={tipsPageHref}>
                  <BookOpen className="size-4 shrink-0 opacity-80" aria-hidden />
                  {tBanner("seeAll")}
                  <ChevronRight className="size-4 shrink-0 opacity-70" aria-hidden />
                </Link>
              </Button>
              <button
                type="button"
                onClick={handleDismiss}
                className={cn(dismissButtonClassName, "hidden sm:inline-flex")}
                aria-label={tBanner("dismiss")}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="mt-4 md:mt-6">
            <TipsCarousel
              tips={TIPS_BANNER_CATALOG}
              locale={locale}
              workspaceSlug={workspaceSlug}
              userId={preview ? null : currentUserId}
              pinnedIds={preview ? [] : pinnedIds}
              dismissedIds={preview ? [] : dismissedIds}
              showIndex={false}
              enableDismiss={!preview}
              enablePin={!preview}
              onDismissTip={preview ? undefined : dismissTip}
              onPinToggle={preview ? undefined : togglePin}
            />
          </div>
        </div>

        <div className="hidden flex-col gap-4 border-t border-border/50 bg-muted/25 px-4 py-3.5 sm:flex sm:flex-row sm:items-center sm:justify-between md:px-6 dark:bg-muted/20">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/12 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:ring-amber-400/15">
              <Sparkles className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-none">
              <span className="font-semibold text-foreground">{tBanner("suggestionTitle")}</span>
              <span
                className="hidden h-5 w-px shrink-0 bg-border/80 sm:block"
                aria-hidden
              />
              <span className="text-muted-foreground">{tBanner("suggestionHint")}</span>
            </div>
          </div>

          {issueTrackerEnabled ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 gap-2 rounded-md border-border/70 bg-background/50 px-4 text-xs font-medium"
              onClick={() => setReportOpen(true)}
            >
              {tBanner("submitSuggestion")}
              <ExternalLink className="size-3.5 shrink-0 opacity-70" aria-hidden />
            </Button>
          ) : null}
        </div>
      </section>

      {issueTrackerEnabled ? (
        <ReportIssueDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          locale={locale}
          workspaceSlug={workspaceSlug}
          presetType="TIP_SUGGESTION"
        />
      ) : null}
    </>
  );
}
