type ReferralAnalyticsPayload = Record<
  string,
  string | number | boolean | undefined
>;

export const ReferralAnalyticsEvents = {
  linkCopied: "referral_link_copied",
  shareClicked: "referral_share_clicked",
} as const;

export function trackReferralEvent(
  event: string,
  payload?: ReferralAnalyticsPayload,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("esteo:referral-analytics", {
      detail: { event, ...payload },
    }),
  );

  if (process.env.NODE_ENV === "development") {
    console.info("[referral-analytics]", event, payload);
  }
}
