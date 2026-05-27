import type { User } from "@prisma/client";

import { syncUserFromClerk } from "@/server/auth/sync-user";

export async function getCurrentUser(): Promise<User | null> {
  return syncUserFromClerk();
}
