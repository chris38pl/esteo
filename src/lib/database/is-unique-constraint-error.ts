/**
 * Detects Prisma unique-constraint violations (P2002) without importing @prisma/client
 * runtime types, so callers can handle concurrent-create races safely.
 */
export function isUniqueConstraintError(
  error: unknown,
  field?: string,
): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as {
    code?: string;
    meta?: { target?: string | string[] };
  };

  if (record.code !== "P2002") {
    return false;
  }

  if (!field) {
    return true;
  }

  const target = record.meta?.target;
  if (!target) {
    return true;
  }

  const fields = Array.isArray(target) ? target : [target];
  return fields.includes(field);
}
