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

function readIssueField(issue: ZodIssue, key: string): unknown {
  return (issue as unknown as Record<string, unknown>)[key];
}

function humanizeZodIssue(issue: ZodIssue, locale: Locale): IntegrationValidationIssue {
  const path = issue.path.map(String).join(".") || "(root)";
  const code = String(issue.code);
  const base: IntegrationValidationIssue = {
    path,
    code,
    message: issue.message,
  };

  if (code === "invalid_type") {
    const expected = readIssueField(issue, "expected");
    const received = readIssueField(issue, "received");
    base.expected = expected === undefined ? undefined : String(expected);
    base.received = describeReceived(received);
    if (received === undefined) {
      base.code = "required";
      base.message =
        locale === "pl"
          ? `Pole wymagane (oczekiwano: ${base.expected ?? "value"}).`
          : `Required field (expected: ${base.expected ?? "value"}).`;
    } else {
      base.message =
        locale === "pl"
          ? `Nieprawidłowy typ (oczekiwano: ${base.expected ?? "value"}, otrzymano: ${base.received}).`
          : `Invalid type (expected: ${base.expected ?? "value"}, received: ${base.received}).`;
    }
    return base;
  }

  if (code === "too_small") {
    const minimum = readIssueField(issue, "minimum");
    base.message =
      locale === "pl"
        ? `Wartość za krótka/za mała (min. ${minimum === undefined ? "?" : String(minimum)}).`
        : `Value too small/short (min ${minimum === undefined ? "?" : String(minimum)}).`;
    return base;
  }

  if (code === "too_big") {
    const maximum = readIssueField(issue, "maximum");
    base.message =
      locale === "pl"
        ? `Wartość za długa/za duża (max. ${maximum === undefined ? "?" : String(maximum)}).`
        : `Value too large/long (max ${maximum === undefined ? "?" : String(maximum)}).`;
    return base;
  }

  if (code === "invalid_format" || code === "invalid_string") {
    const format =
      readIssueField(issue, "format") ??
      readIssueField(issue, "validation") ??
      "format";
    base.message =
      locale === "pl"
        ? `Nieprawidłowy format (${String(format)}).`
        : `Invalid string format (${String(format)}).`;
    return base;
  }

  if (code === "invalid_value" || code === "invalid_enum_value") {
    const values = readIssueField(issue, "values") ?? readIssueField(issue, "options");
    const options = Array.isArray(values) ? values.map(String).join(", ") : "";
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
