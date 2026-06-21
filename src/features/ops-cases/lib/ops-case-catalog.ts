import type { OpsCaseSeverity, OpsCaseType } from "@prisma/client";

export type OpsCaseCatalogEntry = {
  type: OpsCaseType;
  fingerprint: string;
  defaultSeverity: OpsCaseSeverity;
  slaOffsetMs: number;
  titleTemplate: string;
  runbookUrl: string;
};

export const OPS_CASE_CATALOG = {
  REFERRAL_REWARD_FAILED: {
    type: "REFERRAL_REWARD_FAILED",
    fingerprint: "REFERRAL_REWARD_FAILED",
    defaultSeverity: "HIGH",
    slaOffsetMs: 24 * 60 * 60 * 1000,
    titleTemplate: "Nie przyznano bonusu referral",
    runbookUrl: "/docs/runbooks/referral-failure",
  },
} as const satisfies Record<OpsCaseType, OpsCaseCatalogEntry>;

export function getOpsCaseCatalogEntry(type: OpsCaseType): OpsCaseCatalogEntry {
  return OPS_CASE_CATALOG[type];
}

export function computeOpsCaseDueAt(severity: OpsCaseSeverity, from: Date = new Date()): Date {
  const entry = Object.values(OPS_CASE_CATALOG).find((item) => item.defaultSeverity === severity);
  const offsetMs =
    severity === "CRITICAL"
      ? 60 * 60 * 1000
      : severity === "HIGH"
        ? 24 * 60 * 60 * 1000
        : severity === "MEDIUM"
          ? 7 * 24 * 60 * 60 * 1000
          : (entry?.slaOffsetMs ?? 30 * 24 * 60 * 60 * 1000);

  return new Date(from.getTime() + offsetMs);
}
