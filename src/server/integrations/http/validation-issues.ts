import type { ZodIssue } from "zod";

import type { Locale } from "@/lib/locale";

export type IntegrationValidationIssue = {
  path: string;
  code: string;
  message: string;
  expected?: string;
  received?: string;
};

function describeReceived(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
}

function humanizeZodIssue(issue: ZodIssue, locale: Locale): IntegrationValidationIssue {
  const path = issue.path.join(".") || "(root)";
  const base: IntegrationValidationIssue = {
    path,
    code: issue.code,
    message: issue.message,
  };

  if (issue.code === "invalid_type") {
    base.expected = issue.expected;
    base.received = describeReceived(issue.received);
    if (issue.received === undefined) {
      base.code = "required";
      base.message =
        locale === "pl"
          ? `Pole wymagane (oczekiwano: ${issue.expected}).`
          : `Required field (expected: ${issue.expected}).`;
    } else {
      base.message =
        locale === "pl"
          ? `Nieprawidłowy typ (oczekiwano: ${issue.expected}, otrzymano: ${base.received}).`
          : `Invalid type (expected: ${issue.expected}, received: ${base.received}).`;
    }
    return base;
  }

  if (issue.code === "too_small") {
    const minimum = "minimum" in issue ? String(issue.minimum) : "?";
    base.message =
      locale === "pl"
        ? `Wartość za krótka/za mała (min. ${minimum}).`
        : `Value too small/short (min ${minimum}).`;
    return base;
  }

  if (issue.code === "too_big") {
    const maximum = "maximum" in issue ? String(issue.maximum) : "?";
    base.message =
      locale === "pl"
        ? `Wartość za długa/za duża (max. ${maximum}).`
        : `Value too large/long (max ${maximum}).`;
    return base;
  }

  if (issue.code === "invalid_string") {
    const validation = "validation" in issue ? String(issue.validation) : "format";
    base.message =
      locale === "pl"
        ? `Nieprawidłowy format (${validation}).`
        : `Invalid string format (${validation}).`;
    return base;
  }

  if (issue.code === "invalid_enum_value") {
    const options =
      "options" in issue && Array.isArray(issue.options)
        ? issue.options.map(String).join(", ")
        : "";
    base.message =
      locale === "pl"
        ? `Niedozwolona wartość.${options ? ` Dozwolone: ${options}.` : ""}`
        : `Invalid enum value.${options ? ` Allowed: ${options}.` : ""}`;
    return base;
  }

  return base;
}

export function mapZodIssuesToIntegrationIssues(
  issues: ZodIssue[],
  locale: Locale,
): IntegrationValidationIssue[] {
  return issues.map((issue) => humanizeZodIssue(issue, locale));
}

export function summarizeValidationIssues(
  issues: IntegrationValidationIssue[],
  locale: Locale,
): string {
  if (issues.length === 0) {
    return locale === "pl"
      ? "Payload nie przeszedł walidacji."
      : "Payload validation failed.";
  }

  const paths = [...new Set(issues.map((issue) => issue.path))];
  const preview = paths.slice(0, 5).join(", ");
  const more = paths.length > 5 ? ` (+${paths.length - 5})` : "";

  if (locale === "pl") {
    return `Brakujące lub nieprawidłowe pola: ${preview}${more}.`;
  }
  return `Missing or invalid fields: ${preview}${more}.`;
}

export function parseIndustryFieldValidationMessage(
  message: string,
  locale: Locale,
): { issues: IntegrationValidationIssue[]; summary: string } {
  const requiredMatch = message.match(/^Field "([^"]+)" is required\./);
  if (requiredMatch?.[1]) {
    const path = `industryFields.${requiredMatch[1]}`;
    const issue: IntegrationValidationIssue = {
      path,
      code: "required",
      message:
        locale === "pl"
          ? "Pole branżowe jest wymagane."
          : "Industry field is required.",
    };
    return {
      issues: [issue],
      summary: summarizeValidationIssues([issue], locale),
    };
  }

  const invalidMatch = message.match(/^Field "([^"]+)"/);
  if (invalidMatch?.[1]) {
    const path = `industryFields.${invalidMatch[1]}`;
    const issue: IntegrationValidationIssue = {
      path,
      code: "invalid",
      message,
    };
    return {
      issues: [issue],
      summary: summarizeValidationIssues([issue], locale),
    };
  }

  const issue: IntegrationValidationIssue = {
    path: "industryFields",
    code: "invalid",
    message,
  };
  return {
    issues: [issue],
    summary: summarizeValidationIssues([issue], locale),
  };
}
