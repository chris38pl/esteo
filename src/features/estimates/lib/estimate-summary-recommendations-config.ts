import type { LucideIcon } from "lucide-react";
import { CalendarClock, FileText, Paperclip } from "lucide-react";

import type { EstimateEditorTabId } from "@/features/estimates/components/estimate-editor-tabs";

export const SUMMARY_RECOMMENDATION_IDS = {
  add_payment_schedule: "add_payment_schedule",
  attach_investment_photos: "attach_investment_photos",
  generate_pdf: "generate_pdf",
} as const;

export type SummaryRecommendationId =
  (typeof SUMMARY_RECOMMENDATION_IDS)[keyof typeof SUMMARY_RECOMMENDATION_IDS];

export type SummaryRecommendationDefinition = {
  id: SummaryRecommendationId;
  icon: LucideIcon;
  /** Dashboard tab opened when the user selects this recommendation */
  targetTab?: EstimateEditorTabId;
};

export const ESTIMATE_SUMMARY_RECOMMENDATIONS: SummaryRecommendationDefinition[] = [
  {
    id: SUMMARY_RECOMMENDATION_IDS.add_payment_schedule,
    icon: CalendarClock,
    targetTab: "payments",
  },
  {
    id: SUMMARY_RECOMMENDATION_IDS.attach_investment_photos,
    icon: Paperclip,
    targetTab: "attachments",
  },
  {
    id: SUMMARY_RECOMMENDATION_IDS.generate_pdf,
    icon: FileText,
  },
];

export type SummaryRecommendationContext = {
  installmentCount: number;
  attachmentCount: number;
  imageAttachmentCount: number;
};

/**
 * Returns recommendation ids that should be shown for the current estimate state.
 * Extend rules here as sale-readiness signals grow (sent status, PDF export, etc.).
 */
export function resolveSummaryRecommendations(
  context: SummaryRecommendationContext,
): SummaryRecommendationId[] {
  const visible: SummaryRecommendationId[] = [];

  if (context.installmentCount === 0) {
    visible.push(SUMMARY_RECOMMENDATION_IDS.add_payment_schedule);
  }

  if (context.imageAttachmentCount < 2) {
    visible.push(SUMMARY_RECOMMENDATION_IDS.attach_investment_photos);
  }

  visible.push(SUMMARY_RECOMMENDATION_IDS.generate_pdf);

  return visible;
}

export function getSummaryRecommendationDefinition(
  id: SummaryRecommendationId,
): SummaryRecommendationDefinition | undefined {
  return ESTIMATE_SUMMARY_RECOMMENDATIONS.find((entry) => entry.id === id);
}
