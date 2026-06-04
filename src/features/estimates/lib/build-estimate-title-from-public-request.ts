import type { WorkspaceIndustry } from "@prisma/client";

import type { FieldValueInput } from "@/features/industry-fields/server/map-field-value";
import {
  ESTIMATE_TITLE_FROM_PUBLIC_REQUEST_BY_INDUSTRY,
  ESTIMATE_TITLE_FROM_PUBLIC_REQUEST_MAX_LENGTH,
  type EstimateTitleIndustryFieldPart,
} from "@/features/estimates/lib/estimate-title-from-request-config";
import type { Locale } from "@/lib/locale";

export type PublicRequestAddressForTitle = {
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  voivodeship?: string;
};

function cleanSegment(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatCompactAddress(address: PublicRequestAddressForTitle): string {
  const street = address.streetAddress ? cleanSegment(address.streetAddress) : "";
  const city = address.city ? cleanSegment(address.city) : "";

  if (street && city) {
    return `${street}, ${city}`;
  }

  return street || city || "";
}

function formatIndustryFieldSegment(
  part: EstimateTitleIndustryFieldPart,
  raw: FieldValueInput,
  locale: Locale,
): string {
  if (raw === null || raw === undefined || raw === "") {
    return "";
  }

  switch (part.format) {
    case "squareMeters": {
      const numeric =
        typeof raw === "number" ? raw : Number.parseFloat(String(raw).replace(",", "."));
      if (!Number.isFinite(numeric) || numeric <= 0) {
        return "";
      }
      const formatted = new Intl.NumberFormat(locale === "pl" ? "pl-PL" : "en-US", {
        maximumFractionDigits: 2,
      }).format(numeric);
      return `${formatted} m²`;
    }
    case "plain":
    default: {
      if (raw instanceof Date) {
        return raw.toISOString().slice(0, 10);
      }
      return cleanSegment(String(raw));
    }
  }
}

/**
 * Builds `Estimate.title` for the public estimate-request flow:
 * `[Full name], [Address][, industry-specific parts…]`
 */
export function buildEstimateTitleFromPublicRequest(input: {
  industry: WorkspaceIndustry;
  fullName: string;
  address: PublicRequestAddressForTitle;
  industryFieldValues: Record<string, FieldValueInput>;
  locale: Locale;
}): string | null {
  const segments: string[] = [];

  const name = cleanSegment(input.fullName);
  if (name) {
    segments.push(name);
  }

  const addressLine = formatCompactAddress(input.address);
  if (addressLine) {
    segments.push(addressLine);
  }

  const { industryFieldParts } =
    ESTIMATE_TITLE_FROM_PUBLIC_REQUEST_BY_INDUSTRY[input.industry];

  for (const part of industryFieldParts) {
    const segment = formatIndustryFieldSegment(
      part,
      input.industryFieldValues[part.key],
      input.locale,
    );
    if (segment) {
      segments.push(segment);
    }
  }

  if (segments.length === 0) {
    return null;
  }

  const title = segments.join(", ");
  if (title.length <= ESTIMATE_TITLE_FROM_PUBLIC_REQUEST_MAX_LENGTH) {
    return title;
  }

  return title.slice(0, ESTIMATE_TITLE_FROM_PUBLIC_REQUEST_MAX_LENGTH).trimEnd();
}
