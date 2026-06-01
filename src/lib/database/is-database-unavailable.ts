import {
  DATABASE_UNAVAILABLE_CODE,
  DatabaseUnavailableError,
} from "@/lib/database/database-unavailable-error";

/**
 * Detects Neon/Postgres connectivity failures without exposing raw Prisma messages to UI.
 * Uses name/code/message checks only so client error boundaries can import this safely.
 */
export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof DatabaseUnavailableError) {
    return true;
  }

  if (error && typeof error === "object") {
    const record = error as {
      name?: string;
      code?: string;
      message?: string;
    };

    if (record.code === DATABASE_UNAVAILABLE_CODE) {
      return true;
    }

    if (record.name === "DatabaseUnavailableError") {
      return true;
    }

    if (record.name === "PrismaClientInitializationError") {
      return true;
    }

    if (record.code === "P1001" || record.code === "P1002") {
      return true;
    }

    if (typeof record.message === "string") {
      const message = record.message;
      if (message.includes("Can't reach database server")) {
        return true;
      }
      if (message.includes("Connection timed out")) {
        return true;
      }
    }
  }

  return false;
}
