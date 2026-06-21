import { appToast } from "@/components/ui/app-toast";

import {
  ActivationAnalyticsEvents,
  trackActivationEvent,
} from "@/features/activation/lib/activation-analytics";
import {
  hasFirstAiToastShown,
  markFirstAiToastShown,
} from "@/features/activation/lib/activation-storage";

type FirstAiToastTranslations = {
  title: string;
  descriptionLine1: string;
  descriptionLine2: string;
  reviewEstimate: string;
};

export function showFirstAiActionToast(input: {
  workspaceSlug: string;
  t: FirstAiToastTranslations;
}): void {
  if (hasFirstAiToastShown(input.workspaceSlug)) {
    return;
  }

  markFirstAiToastShown(input.workspaceSlug);
  trackActivationEvent(ActivationAnalyticsEvents.firstAiGenerated, {
    workspaceSlug: input.workspaceSlug,
  });

  const toastId = appToast.info(input.t.title, {
    description: `${input.t.descriptionLine1} ${input.t.descriptionLine2}`,
    duration: Infinity,
    showProgress: false,
    primaryAction: {
      label: input.t.reviewEstimate,
      onClick: () => {
        appToast.dismiss(toastId);
        trackActivationEvent(ActivationAnalyticsEvents.firstAiToastAction, {
          workspaceSlug: input.workspaceSlug,
          action: "review",
        });
      },
    },
  });
}
