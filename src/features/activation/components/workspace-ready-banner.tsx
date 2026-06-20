"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import {
  ActivationAnalyticsEvents,
  trackActivationEvent,
} from "@/features/activation/lib/activation-analytics";
import { markWorkspaceReadySeen } from "@/features/activation/lib/activation-storage";

interface WorkspaceReadyBannerProps {
  workspaceSlug: string;
  onDismissed: () => void;
}

export function WorkspaceReadyBanner({
  workspaceSlug,
  onDismissed,
}: WorkspaceReadyBannerProps) {
  const t = useTranslations("activation.workspaceReady");

  useEffect(() => {
    trackActivationEvent(ActivationAnalyticsEvents.workspaceReadyViewed, {
      workspaceSlug,
    });
  }, [workspaceSlug]);

  function dismiss() {
    markWorkspaceReadySeen(workspaceSlug);
    trackActivationEvent(ActivationAnalyticsEvents.workspaceReadyDismissed, {
      workspaceSlug,
      reason: "close",
    });
    onDismissed();
  }

  return (
    <div className="surface-card relative overflow-hidden border-primary/20 bg-primary/5 p-5 md:p-6">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={t("dismiss")}
      >
        <X className="size-4" />
      </button>

      <div className="space-y-1 pr-8">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("descriptionLine1")}</p>
        <p className="text-sm text-muted-foreground">{t("descriptionLine2")}</p>
      </div>
    </div>
  );
}
