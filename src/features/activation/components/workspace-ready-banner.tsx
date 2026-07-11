"use client";

import { FileText, Mail, PartyPopper, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  ActivationAnalyticsEvents,
  trackActivationEvent,
} from "@/features/activation/lib/activation-analytics";
import { markWorkspaceReadySeen } from "@/features/activation/lib/activation-storage";
import { cn } from "@/lib/utils";

interface WorkspaceReadyBannerProps {
  workspaceSlug: string;
  onDismissed: () => void;
  onCreateClick: () => void;
  onCopyFormLink: () => void;
  /** Admin preview - no analytics or localStorage side effects. */
  preview?: boolean;
}

function WorkspaceReadyIllustration() {
  return (
    <div className="relative size-16 shrink-0" aria-hidden>
      <span className="absolute left-0 top-3 size-1 rounded-full bg-violet-400/70" />
      <span className="absolute left-2 top-1 size-1.5 rotate-45 rounded-sm bg-teal-400/60" />
      <span className="absolute right-1 top-2 h-2 w-0.5 rotate-[35deg] rounded-full bg-violet-300/50" />
      <span className="absolute bottom-3 right-0 size-1 rounded-full bg-teal-400/50" />
      <span className="absolute bottom-1 left-3 h-2 w-0.5 -rotate-12 rounded-full bg-violet-300/40" />
      <span className="absolute right-3 top-8 size-1 rotate-45 rounded-sm bg-violet-400/50" />

      <div className="flex size-16 items-center justify-center rounded-full bg-violet-500/15 ring-1 ring-violet-500/25 dark:bg-violet-500/20 dark:ring-violet-400/20">
        <PartyPopper className="size-7 text-violet-500 dark:text-[#8a70ff]" />
      </div>
    </div>
  );
}

function WorkspaceReadyActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-violet-500/5 dark:hover:bg-white/[0.04] sm:px-5"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/12 ring-1 ring-violet-500/20 dark:bg-violet-500/15 dark:ring-violet-400/15">
        <Icon className="size-4 text-violet-600 dark:text-[#8a70ff]" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-none text-foreground dark:text-card-foreground">
          {title}
        </p>
        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}

export function WorkspaceReadyBanner({
  workspaceSlug,
  onDismissed,
  onCreateClick,
  onCopyFormLink,
  preview = false,
}: WorkspaceReadyBannerProps) {
  const t = useTranslations("activation.workspaceReady");
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (preview) {
      return;
    }

    trackActivationEvent(ActivationAnalyticsEvents.workspaceReadyViewed, {
      workspaceSlug,
    });
  }, [preview, workspaceSlug]);

  function dismiss(reason: "close" | "cta" = "close") {
    setIsDismissed(true);
    if (!preview) {
      markWorkspaceReadySeen(workspaceSlug);
      trackActivationEvent(ActivationAnalyticsEvents.workspaceReadyDismissed, {
        workspaceSlug,
        reason,
      });
      onDismissed();
    }
  }

  function handleCreateClick() {
    if (!preview) {
      trackActivationEvent(ActivationAnalyticsEvents.workspaceReadyCtaClicked, {
        workspaceSlug,
        cta: "create_estimate",
      });
      dismiss("cta");
    }
    onCreateClick();
  }

  function handleCopyFormLink() {
    if (!preview) {
      trackActivationEvent(ActivationAnalyticsEvents.workspaceReadyCtaClicked, {
        workspaceSlug,
        cta: "copy_form",
      });
      dismiss("cta");
    }
    onCopyFormLink();
  }

  if (isDismissed && !preview) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 p-5 shadow-sm md:p-6",
        "bg-gradient-to-br from-violet-50/90 to-violet-100/40",
        "dark:from-card dark:to-card",
      )}
    >
      <button
        type="button"
        onPointerUp={(event) => {
          event.stopPropagation();
          dismiss("close");
        }}
        className="absolute right-2 top-2 z-20 inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-foreground dark:hover:bg-white/5 dark:hover:text-card-foreground"
        aria-label={t("dismiss")}
      >
        <X className="size-4" />
      </button>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-8">
        <div className="flex min-w-0 flex-1 items-start gap-4 pr-8">
          <WorkspaceReadyIllustration />

          <div className="min-w-0 space-y-1 pt-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground dark:text-card-foreground">
              {t("title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("descriptionLine1")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("descriptionLine2")}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex w-full shrink-0 flex-col overflow-hidden rounded-xl sm:flex-row xl:w-auto xl:min-w-[28rem]",
            "bg-white dark:bg-muted/30",
          )}
        >
          <WorkspaceReadyActionCard
            icon={FileText}
            title={t("createEstimateTitle")}
            description={t("createEstimateDescription")}
            onClick={handleCreateClick}
          />

          <div
            className="hidden w-px shrink-0 self-stretch bg-border/60 sm:block"
            aria-hidden
          />

          <div className="h-px w-full bg-border/60 sm:hidden" aria-hidden />

          <WorkspaceReadyActionCard
            icon={Mail}
            title={t("sendFormTitle")}
            description={t("sendFormDescription")}
            onClick={handleCopyFormLink}
          />
        </div>
      </div>
    </div>
  );
}
