export const ESTIMATE_ACTIVITY_ACTIONS = {
  estimate_created: "estimate_created",
  estimate_renamed: "estimate_renamed",
  version_created: "version_created",
  version_deleted: "version_deleted",
  version_archived: "version_archived",
  version_unarchived: "version_unarchived",
  version_modified: "version_modified",
  margin_changed: "margin_changed",
  ai_generated: "ai_generated",
  ai_modified: "ai_modified",
  imported_from_price_list: "imported_from_price_list",
  estimate_exported: "estimate_exported",
  sent_to_customer: "sent_to_customer",
  payment_installment_added: "payment_installment_added",
  payment_installment_updated: "payment_installment_updated",
  payment_installment_deleted: "payment_installment_deleted",
  payment_schedule_generated: "payment_schedule_generated",
  payment_installment_reordered: "payment_installment_reordered",
  payment_recorded: "payment_recorded",
  payment_installment_unpaid: "payment_installment_unpaid",
  note_added: "note_added",
  note_replied: "note_replied",
  note_deleted: "note_deleted",
  attachment_added: "attachment_added",
  attachment_deleted: "attachment_deleted",
} as const;

export type EstimateActivityAction =
  (typeof ESTIMATE_ACTIVITY_ACTIONS)[keyof typeof ESTIMATE_ACTIVITY_ACTIONS];

export type ActivityMetadata = {
  versionNumber?: number;
  oldMargin?: number;
  newMargin?: number;
  source?: "manual" | "public_request" | "request_conversion" | "ai" | "price_list";
  installmentName?: string;
  installmentAmount?: number;
  paymentAmount?: number;
  currency?: "PLN" | "EUR";
  presetId?: string;
  installmentCount?: number;
  replyCount?: number;
  fileName?: string;
  fileCount?: number;
  format?: "pdf" | "xlsx";
  versionId?: string;
  estimatePdfId?: string;
  cached?: boolean;
};
