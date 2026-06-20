import { toast } from "sonner";

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
  generatePdf: string;
  sendToClient: string;
};

export function showFirstAiActionToast(input: {
  workspaceSlug: string;
  t: FirstAiToastTranslations;
  onGeneratePdf: () => void;
  onSendToClient: () => void;
}): void {
  if (hasFirstAiToastShown(input.workspaceSlug)) {
    return;
  }

  markFirstAiToastShown(input.workspaceSlug);
  trackActivationEvent(ActivationAnalyticsEvents.firstAiGenerated, {
    workspaceSlug: input.workspaceSlug,
  });

  toast(input.t.title, {
    description: `${input.t.descriptionLine1} ${input.t.descriptionLine2}`,
    duration: Infinity,
    action: {
      label: input.t.generatePdf,
      onClick: () => {
        trackActivationEvent(ActivationAnalyticsEvents.firstAiToastAction, {
          workspaceSlug: input.workspaceSlug,
          action: "pdf",
        });
        input.onGeneratePdf();
      },
    },
    cancel: {
      label: input.t.sendToClient,
      onClick: () => {
        trackActivationEvent(ActivationAnalyticsEvents.firstAiToastAction, {
          workspaceSlug: input.workspaceSlug,
          action: "send",
        });
        input.onSendToClient();
      },
    },
  });
}
