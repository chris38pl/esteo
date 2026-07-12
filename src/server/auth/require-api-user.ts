import type { User } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { getCurrentUser } from "@/server/auth/get-current-user";

/**
 * API-side counterpart of `requireAuth`.
 *
 * Unlike the web `requireAuth` (which `redirect()`s to the sign-in page), this
 * throws a tRPC `UNAUTHORIZED` error so external clients (React Native, CLI,
 * partner API, ...) receive a clean 401 instead of an HTML redirect.
 *
 * Clerk resolves the caller from either the session cookie (web) or the
 * `Authorization: Bearer <token>` header (mobile/other clients) transparently.
 */
export async function requireApiUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return user;
}
