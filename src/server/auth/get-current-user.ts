import type { User } from "@prisma/client";

import { DatabaseUnavailableError } from "@/lib/database/database-unavailable-error";
import { throwIfDatabaseUnavailable } from "@/server/db/log-database-unavailable";
import { syncUserFromClerk } from "@/server/auth/sync-user";

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await syncUserFromClerk();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      throw error;
    }

    throwIfDatabaseUnavailable(error, "getCurrentUser");
  }
}
