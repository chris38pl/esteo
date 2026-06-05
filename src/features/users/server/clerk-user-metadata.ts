import { clerkClient } from "@clerk/nextjs/server";

import {
  resolveAuthProvider,
  type AuthProviderKind,
} from "@/server/auth/resolve-user-display-name";

export type { AuthProviderKind };

export type ClerkUserMetadata = {
  provider: AuthProviderKind;
  lastActiveAt: Date | null;
};

function resolveLastActiveAt(lastActiveAt: number | null, lastSignInAt: number | null): Date | null {
  const timestamp = lastActiveAt ?? lastSignInAt;
  return timestamp ? new Date(timestamp) : null;
}

export async function fetchClerkMetadataForUsers(
  clerkIds: string[],
): Promise<Map<string, ClerkUserMetadata>> {
  const map = new Map<string, ClerkUserMetadata>();

  if (clerkIds.length === 0) {
    return map;
  }

  const client = await clerkClient();
  const results = await Promise.allSettled(
    clerkIds.map((clerkId) => client.users.getUser(clerkId)),
  );

  clerkIds.forEach((clerkId, index) => {
    const result = results[index];

    if (result.status === "fulfilled") {
      const clerkUser = result.value;
      map.set(clerkId, {
        provider: resolveAuthProvider(clerkUser.externalAccounts),
        lastActiveAt: resolveLastActiveAt(clerkUser.lastActiveAt, clerkUser.lastSignInAt),
      });
      return;
    }

    map.set(clerkId, {
      provider: "standard",
      lastActiveAt: null,
    });
  });

  return map;
}
