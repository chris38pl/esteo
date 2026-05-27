import type { User } from "@prisma/client";
import { redirect } from "next/navigation";

import { syncUserFromClerk } from "@/server/auth/sync-user";

export async function requireAuth(locale: string = "pl"): Promise<User> {
  const user = await syncUserFromClerk();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  return user;
}
