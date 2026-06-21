export const ACTIVATION_PREVIEW_GROUP_IDS = [
  "onboarding",
  "estimates",
  "estimate_editor",
  "pdf",
  "tips",
] as const;

export type ActivationPreviewGroupId = (typeof ACTIVATION_PREVIEW_GROUP_IDS)[number];

export const ACTIVATION_PREVIEW_ITEM_IDS = [
  "workspace_ready_banner",
  "form_link_toast",
  "form_copy_simple_toast",
  "ai_generating_skeleton",
  "estimate_send_toast_loading",
  "estimate_send_toast_success",
  "estimate_send_toast_error",
  "company_profile_modal",
  "pdf_export_toast",
  "pdf_export_error",
  "pdf_popup_blocked_toast",
  "tips_banner",
] as const;

export type ActivationPreviewItemId = (typeof ACTIVATION_PREVIEW_ITEM_IDS)[number];

export type ActivationPreviewCatalogItem = {
  id: ActivationPreviewItemId;
  groupId: ActivationPreviewGroupId;
};

export const ACTIVATION_PREVIEW_CATALOG: ActivationPreviewCatalogItem[] = [
  { id: "workspace_ready_banner", groupId: "onboarding" },
  { id: "form_link_toast", groupId: "estimates" },
  { id: "form_copy_simple_toast", groupId: "estimates" },
  { id: "ai_generating_skeleton", groupId: "estimate_editor" },
  { id: "estimate_send_toast_loading", groupId: "estimate_editor" },
  { id: "estimate_send_toast_success", groupId: "estimate_editor" },
  { id: "estimate_send_toast_error", groupId: "estimate_editor" },
  { id: "company_profile_modal", groupId: "pdf" },
  { id: "pdf_export_toast", groupId: "pdf" },
  { id: "pdf_export_error", groupId: "pdf" },
  { id: "pdf_popup_blocked_toast", groupId: "pdf" },
  { id: "tips_banner", groupId: "tips" },
];

export const DEFAULT_ACTIVATION_PREVIEW_ITEM_ID: ActivationPreviewItemId =
  "workspace_ready_banner";
