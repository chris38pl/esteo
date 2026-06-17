import "server-only";

import { auth, reverificationError } from "@clerk/nextjs/server";

import { PermissionError } from "@/server/permissions/errors";

export async function requireTransferReverification() {
  const { userId, has } = await auth();

  if (!userId) {
    throw new PermissionError("You must be signed in.");
  }

  if (!has({ reverification: "strict" })) {
    return reverificationError("strict");
  }

  return null;
}
