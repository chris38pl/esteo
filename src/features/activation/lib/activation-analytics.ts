type ActivationAnalyticsPayload = Record<
  string,
  string | number | boolean | undefined
>;

export const ActivationAnalyticsEvents = {
  workspaceReadyViewed: "activation_workspace_ready_viewed",
  workspaceReadyCtaClicked: "activation_workspace_ready_cta_clicked",
  workspaceReadyDismissed: "activation_workspace_ready_dismissed",
  firstEstimateCreated: "activation_first_estimate_created",
  firstPdfGenerated: "activation_first_pdf_generated",
  formLinkCopied: "activation_form_link_copied",
  publicFormReceived: "activation_public_form_received",
  firstEstimateSent: "activation_first_estimate_sent",
  companyProfileCompleted: "activation_company_profile_completed",
} as const;

export function trackActivationEvent(
  event: string,
  payload?: ActivationAnalyticsPayload,
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("esteo:activation-analytics", {
      detail: { event, ...payload },
    }),
  );

  if (process.env.NODE_ENV === "development") {
    console.info("[activation-analytics]", event, payload);
  }
}
