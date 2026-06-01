import { clerkClient } from "@clerk/nextjs/server";

export type AuthProviderKind = "google" | "standard";

export type ClerkUserMetadata = {
  provider: AuthProviderKind;
  lastActiveAt: Date | null;
};

function resolveProvider(
  externalAccounts: Array<{ provider: string }>,
): AuthProviderKind {
  const hasGoogle = externalAccounts.some((account) => {
    const provider = account.provider.toLowerCase();
    return provider === "google" || provider === "oauth_google";
  });

  return hasGoogle ? "google" : "standard";
}

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
        provider: resolveProvider(clerkUser.externalAccounts),
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
