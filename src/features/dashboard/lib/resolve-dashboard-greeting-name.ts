export function resolveDashboardGreetingName(
  name: string | null | undefined,
  email: string,
): string {
  const trimmed = name?.trim();
  if (trimmed) {
    return trimmed.split(/\s+/)[0] ?? trimmed;
  }

  const emailLocal = email.split("@")[0]?.trim();
  return emailLocal || email;
}
