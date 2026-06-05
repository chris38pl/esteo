export type AuthProviderKind = "google" | "apple" | "standard";

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

  if (hasGoogle) {
    return "google";
  }

  const hasApple = externalAccounts.some((account) => {
    const provider = account.provider.toLowerCase();
    return provider === "apple" || provider === "oauth_apple";
  });

  return hasApple ? "apple" : "standard";
}

export function resolveUserDisplayName(clerkUser: ClerkUserLike): string | null {
  return [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
}
