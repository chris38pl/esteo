import { isDatabaseUnavailable } from "@/lib/database/is-database-unavailable";
import { DatabaseUnavailableError } from "@/lib/database/database-unavailable-error";

type DatabaseUnavailableContext = {
  operation: string;
  cause: unknown;
};

export function logDatabaseUnavailable(context: DatabaseUnavailableContext): void {
  const { operation, cause } = context;
  const prismaCode =
    cause &&
    typeof cause === "object" &&
    "code" in cause &&
    typeof (cause as { code: unknown }).code === "string"
      ? (cause as { code: string }).code
      : undefined;

  console.error(
    JSON.stringify({
      event: "database_unavailable",
      operation,
      prismaCode,
      errorName: cause instanceof Error ? cause.name : undefined,
    }),
  );
}

/** Maps connectivity errors to DatabaseUnavailableError; rethrows all other errors unchanged. */
export function throwIfDatabaseUnavailable(error: unknown, operation: string): never {
  if (isDatabaseUnavailable(error)) {
    logDatabaseUnavailable({ operation, cause: error });
    throw new DatabaseUnavailableError();
  }

  throw error;
}
