import "server-only";

import { Resend } from "resend";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    resendClient = getResendClient();
  }

  return resendClient;
}

const PRODUCTION_DEFAULT_FROM = "estimates@mail.esteo.app";
const RESEND_SANDBOX_FROM = "onboarding@resend.dev";

export function getEmailFromAddress(): string {
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Esteo";

  if (process.env.NODE_ENV === "development") {
    if (process.env.EMAIL_FROM_DEV?.trim()) {
      return `${fromName} <${process.env.EMAIL_FROM_DEV.trim()}>`;
    }
    if (process.env.EMAIL_USE_PRODUCTION_FROM === "true" && process.env.EMAIL_FROM?.trim()) {
      return `${fromName} <${process.env.EMAIL_FROM.trim()}>`;
    }
    return `${fromName} <${RESEND_SANDBOX_FROM}>`;
  }

  const fromEmail = process.env.EMAIL_FROM?.trim() || PRODUCTION_DEFAULT_FROM;
  return `${fromName} <${fromEmail}>`;
}

export function resolveDeliveryEmail(intendedRecipient: string): string {
  if (process.env.NODE_ENV === "development" && process.env.EMAIL_DEV_REDIRECT_TO?.trim()) {
    return process.env.EMAIL_DEV_REDIRECT_TO.trim();
  }

  return intendedRecipient.trim();
}

export function resolveReplyToEmail(input: {
  companyEmail?: string | null;
  sendingUserEmail: string;
}): string {
  const company = input.companyEmail?.trim();
  if (company) {
    return company;
  }

  const userEmail = input.sendingUserEmail.trim();
  if (userEmail) {
    return userEmail;
  }

  return process.env.EMAIL_FROM?.trim() || "estimates@mail.esteo.app";
}

export function buildDevEmailSubject(intendedRecipient: string, subject: string): string {
  if (process.env.NODE_ENV === "development" && process.env.EMAIL_DEV_REDIRECT_TO?.trim()) {
    return `[DEV → ${intendedRecipient}] ${subject}`;
  }

  return subject;
}
