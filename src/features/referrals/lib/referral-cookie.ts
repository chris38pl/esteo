export const REFERRAL_COOKIE_NAME = "esteo_ref_code";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const referralCookieSerializeOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
  path: "/",
};
