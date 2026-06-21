import type { OpsCaseStatus } from "@prisma/client";

export const OPS_CASE_ACTIVE_STATUSES: OpsCaseStatus[] = ["OPEN", "IN_PROGRESS"];

export const OPS_CASE_CLOSED_STATUSES: OpsCaseStatus[] = ["RESOLVED", "IGNORED", "ARCHIVED"];
