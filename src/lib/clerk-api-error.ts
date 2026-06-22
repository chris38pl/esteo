import type { ClerkAPIError } from "@clerk/types";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

import { getClerkLocalization } from "@/lib/clerk-localization";
import type { Locale } from "@/lib/locale";

export type ClerkElementsError = {
  code: string;
  message: string;
};

/**
 * Clerk FAPI returns English longMessage even when UI locale is pl.
 * Map known EN strings to stable error codes for @clerk/localizations lookup.
 */
export const CLERK_DEVELOPMENT_EMAIL_LIMIT_MESSAGE =
  "Development monthly email limit exceeded";

const ENGLISH_MESSAGE_TO_ERROR_CODE: Record<string, string> = {
  "Password is incorrect. Try again, or use another method.":
    "form_password_incorrect",
  "Password or email address is incorrect. Try again, or use another method.":
    "form_password_or_identifier_incorrect",
  "Identifier is invalid.": "form_param_format_invalid__identifier",
  "Incorrect code": "form_code_incorrect",
  [CLERK_DEVELOPMENT_EMAIL_LIMIT_MESSAGE]: "development_email_limit_exceeded",
};

function clerkErrorMessages(error: ClerkAPIError): string[] {
  return [error.message, error.longMessage].filter(
    (message): message is string => typeof message === "string" && message.length > 0,
  );
}

export function isClerkDevelopmentEmailLimitError(error: unknown): boolean {
  if (isClerkAPIResponseError(error)) {
    return error.errors.some((clerkError) =>
      clerkErrorMessages(clerkError).some(
        (message) =>
          message.includes(CLERK_DEVELOPMENT_EMAIL_LIMIT_MESSAGE) ||
          /monthly email limit exceeded/i.test(message),
      ),
    );
  }

  if (error instanceof Error && error.message) {
    return (
      error.message.includes(CLERK_DEVELOPMENT_EMAIL_LIMIT_MESSAGE) ||
      /monthly email limit exceeded/i.test(error.message)
    );
  }

  return false;
}

function inferErrorCodeFromMessage(message: string): string | undefined {
  return ENGLISH_MESSAGE_TO_ERROR_CODE[message.trim()];
}

export function lookupLocalizedError(
  error: Pick<ClerkAPIError, "code" | "meta">,
  locale: Locale,
): string | undefined {
  const errors = getClerkLocalization(locale).unstable__errors;
  if (!errors) {
    return undefined;
  }

  const { code, meta } = error;
  const paramName = meta?.paramName;

  if (paramName) {
    const specificKey = `${code}__${paramName}` as keyof typeof errors;
    const specific = errors[specificKey];
    if (typeof specific === "string" && specific.length > 0) {
      return specific;
    }
  }

  const generic = errors[code as keyof typeof errors];
  if (typeof generic === "string" && generic.length > 0) {
    return generic;
  }

  return undefined;
}

function lookupLocalizedErrorByCode(
  code: string,
  locale: Locale,
): string | undefined {
  return lookupLocalizedError({ code }, locale);
}

function resolveLocalizedFieldError(
  error: ClerkElementsError,
  locale: Locale,
  fallback?: string,
): string {
  const codesToTry = [
    error.code,
    inferErrorCodeFromMessage(error.message),
  ].filter((code): code is string => Boolean(code));

  for (const code of codesToTry) {
    const localized = lookupLocalizedErrorByCode(code, locale);
    if (localized) {
      return localized;
    }
  }

  if (locale === "en") {
    return error.message;
  }

  return fallback ?? error.message;
}

export function getLocalizedClerkFieldError(
  error: ClerkElementsError,
  locale: Locale,
  fallback?: string,
): string {
  return resolveLocalizedFieldError(error, locale, fallback);
}

export function getLocalizedClerkFieldErrorMessage(
  message: string,
  locale: Locale,
  fallback: string,
): string {
  return resolveLocalizedFieldError({ code: "", message }, locale, fallback);
}

export function getLocalizedClerkErrorMessage(
  error: unknown,
  locale: Locale,
  fallback: string,
  options?: { emailLimitFallback?: string },
): string {
  if (
    options?.emailLimitFallback &&
    isClerkDevelopmentEmailLimitError(error)
  ) {
    return options.emailLimitFallback;
  }

  if (isClerkAPIResponseError(error) && error.errors[0]) {
    const clerkError = error.errors[0];
    return resolveLocalizedFieldError(
      {
        code: clerkError.code,
        message: clerkError.longMessage ?? clerkError.message ?? "",
      },
      locale,
      fallback,
    );
  }

  if (error instanceof Error && error.message) {
    return resolveLocalizedFieldError(
      { code: "", message: error.message },
      locale,
      fallback,
    );
  }

  return fallback;
}
