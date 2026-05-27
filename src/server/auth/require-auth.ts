import type { User } from "@prisma/client";

import { AuthError } from "@/server/auth/errors";
import { syncUserFromClerk } from "@/server/auth/sync-user";

export async function requireAuth(): Promise<User> {
  const user = await syncUserFromClerk();

  if (!user) {
    throw new AuthError();
  }

  return user;
}
