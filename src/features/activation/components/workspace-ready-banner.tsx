"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import {
  ActivationAnalyticsEvents,
  trackActivationEvent,
} from "@/features/activation/lib/activation-analytics";
import { markWorkspaceReadySeen } from "@/features/activation/lib/activation-storage";
import { Button } from "@/components/ui/button";

interface WorkspaceReadyBannerProps {
  workspaceSlug: string;
  onCreateClick: () => void;
  onCopyFormLink: () => void;
  onDismissed: () => void;
}

export function WorkspaceReadyBanner({
  workspaceSlug,
  onCreateClick,
  onCopyFormLink,
  onDismissed,
}: WorkspaceReadyBannerProps) {
  const t = useTranslations("activation.workspaceReady");

  useEffect(() => {
    trackActivationEvent(ActivationAnalyticsEvents.workspaceReadyViewed, {
      workspaceSlug,
    });
  }, [workspaceSlug]);

  function dismiss(reason: "cta" | "close") {
    markWorkspaceReadySeen(workspaceSlug);
    trackActivationEvent(ActivationAnalyticsEvents.workspaceReadyDismissed, {
      workspaceSlug,
      reason,
    });
    onDismissed();
  }

  function handleCreate() {
    trackActivationEvent(ActivationAnalyticsEvents.workspaceReadyCtaClicked, {
      workspaceSlug,
      action: "create",
    });
    dismiss("cta");
    onCreateClick();
  }

  function handleCopyForm() {
    trackActivationEvent(ActivationAnalyticsEvents.workspaceReadyCtaClicked, {
      workspaceSlug,
      action: "copy_form",
    });
    dismiss("cta");
    onCopyFormLink();
  }

  return (
    <div className="surface-card relative overflow-hidden border-primary/20 bg-primary/5 p-5 md:p-6">
      <button
        type="button"
        onClick={() => dismiss("close")}
        className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={t("dismiss")}
      >
        <X className="size-4" />
      </button>

      <div className="space-y-4 pr-8">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("descriptionLine1")}</p>
          <p className="text-sm text-muted-foreground">{t("descriptionLine2")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleCreate}>
            {t("createCta")}
          </Button>
          <Button type="button" variant="outline" onClick={handleCopyForm}>
            {t("copyFormCta")}
          </Button>
        </div>
      </div>
    </div>
  );
}
