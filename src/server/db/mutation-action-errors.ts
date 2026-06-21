import { getServerTranslations } from "@/i18n/request-locale";
import {
  DATABASE_UNAVAILABLE_CODE,
  type DatabaseUnavailableError,
} from "@/lib/database/database-unavailable-error";
import { isDatabaseUnavailable } from "@/lib/database/is-database-unavailable";
import type { Locale } from "@/lib/locale";
import { logDatabaseUnavailable } from "@/server/db/log-database-unavailable";

export function extractPrismaCode(error: unknown): string | undefined {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return undefined;
}

export function logMutationActionFailure(
  event: string,
  context: Record<string, unknown>,
  error: unknown,
): void {
  const payload = {
    event,
    ...context,
    errorName: error instanceof Error ? error.name : undefined,
    errorMessage: error instanceof Error ? error.message : String(error),
    prismaCode: extractPrismaCode(error),
  };

  console.error(JSON.stringify(payload));
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }

  if (isDatabaseUnavailable(error)) {
    logDatabaseUnavailable({ operation: event, cause: error });
  }
}

export async function mapDatabaseUnavailableActionError(
  error: unknown,
  locale: Locale,
): Promise<{
  success: false;
  error: string;
  code: typeof DATABASE_UNAVAILABLE_CODE;
}> | null> {
  if (!isDatabaseUnavailable(error)) {
    return null;
  }

  const t = await getServerTranslations(locale, "common");

  return {
    success: false,
    error: t("databaseUnavailable.message"),
    code: DATABASE_UNAVAILABLE_CODE,
  };
}
