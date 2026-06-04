import type { WorkspaceIndustry } from "@prisma/client";

/**
 * How an industry field value is rendered in `Estimate.title` (public request flow).
 * Extend per industry in `ESTIMATE_TITLE_FROM_PUBLIC_REQUEST_BY_INDUSTRY`.
 */
export type EstimateTitleIndustryFieldFormat = "plain" | "squareMeters";

export type EstimateTitleIndustryFieldPart = {
  /** `IndustryFieldDefinition.key` (e.g. `area_size` for construction). */
  key: string;
  format: EstimateTitleIndustryFieldFormat;
};

export type EstimateTitleFromPublicRequestConfig = {
  /** Extra segments appended after full name and address (industry-specific). */
  industryFieldParts: EstimateTitleIndustryFieldPart[];
};

/**
 * Per-industry title segments for estimates created via the public request form.
 * Base segments (all industries): customer full name, formatted address.
 */
export const ESTIMATE_TITLE_FROM_PUBLIC_REQUEST_BY_INDUSTRY: Record<
  WorkspaceIndustry,
  EstimateTitleFromPublicRequestConfig
> = {
  CONSTRUCTION: {
    industryFieldParts: [{ key: "area_size", format: "squareMeters" }],
  },
  ELECTRICAL: {
    industryFieldParts: [],
  },
  CARPENTRY: {
    industryFieldParts: [],
  },
  PLUMBING: {
    industryFieldParts: [],
  },
  OTHER: {
    industryFieldParts: [],
  },
};

export const ESTIMATE_TITLE_FROM_PUBLIC_REQUEST_MAX_LENGTH = 200;
