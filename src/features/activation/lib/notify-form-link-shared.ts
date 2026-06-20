import { toast } from "sonner";

import {
  ActivationAnalyticsEvents,
  trackActivationEvent,
} from "@/features/activation/lib/activation-analytics";
import { markFormLinkCopied } from "@/features/activation/lib/activation-storage";

const FORM_LINK_SHARED_TOAST_DURATION_MS = 5000;

export function showFormLinkSharedToast(title: string, description: string): void {
  toast.success(title, {
    description,
    duration: FORM_LINK_SHARED_TOAST_DURATION_MS,
  });
}

export function notifyFormLinkShared(input: {
  workspaceSlug: string;
  title: string;
  description: string;
  onStateChange?: () => void;
}): void {
  markFormLinkCopied(input.workspaceSlug);
  trackActivationEvent(ActivationAnalyticsEvents.formLinkCopied, {
    workspaceSlug: input.workspaceSlug,
  });
  showFormLinkSharedToast(input.title, input.description);
  input.onStateChange?.();
}
