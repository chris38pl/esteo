"use server";

import type { Locale } from "@/lib/locale";
import { publicEstimateRequestSchema, type PublicEstimateRequestInput } from "@/features/estimate-requests/schemas/request";
import { createPublicEstimateRequest } from "@/features/estimate-requests/server/public-service";
import {
  assertPublicSubmitRateLimit,
  getPublicRequestFingerprint,
  isHoneypotFilled,
  verifyEstimateRequestCaptcha,
} from "@/features/estimate-requests/server/security";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: "invalid" | "rate_limited" | "captcha_failed" | "unavailable" };

export async function submitPublicEstimateRequestAction(
  input: PublicEstimateRequestInput,
  locale: Locale,
): Promise<ActionResult<{ id: string | null; requestNumber: string | null }>> {
  const parsed = publicEstimateRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "invalid" };
  }

  if (isHoneypotFilled(parsed.data.security?.companyWebsite)) {
    return { success: true, data: { id: null, requestNumber: null } };
  }

  try {
    const fingerprint = await getPublicRequestFingerprint();

    assertPublicSubmitRateLimit({
      workspaceSlug: parsed.data.workspaceSlug,
      ip: fingerprint.ip,
    });

    const captcha = await verifyEstimateRequestCaptcha(parsed.data.security?.captchaToken);
    if (!captcha.ok) {
      return { success: false, error: "captcha_failed" };
    }

    const request = await createPublicEstimateRequest({
      locale,
      payload: parsed.data,
      requestMeta: fingerprint,
    });

    return {
      success: true,
      data: { id: request.id, requestNumber: request.requestNumber },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return { success: false, error: "rate_limited" };
    }

    return { success: false, error: "unavailable" };
  }
}

export async function checkEstimateRequestWithAiAction(): Promise<
  ActionResult<{ suggestions: string[] }>
> {
  return { success: false, error: "unavailable" };
}
