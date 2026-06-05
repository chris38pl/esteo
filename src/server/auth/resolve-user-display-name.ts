export type AuthProviderKind = "google" | "standard";

type ClerkUserLike = {
  firstName: string | null;
  lastName: string | null;
  externalAccounts: Array<{ provider: string }>;
};

export function resolveAuthProvider(
  externalAccounts: Array<{ provider: string }>,
): AuthProviderKind {
  const hasGoogle = externalAccounts.some((account) => {
    const provider = account.provider.toLowerCase();
    return provider === "google" || provider === "oauth_google";
  });

  return hasGoogle ? "google" : "standard";
}

export function resolveUserDisplayName(clerkUser: ClerkUserLike): string | null {
  return [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
}
