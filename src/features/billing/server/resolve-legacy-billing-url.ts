import "server-only";

import {
  getAccessibleWorkspaces,
  getFirstOwnedWorkspace,
} from "@/features/workspaces/server/accessible-workspaces";
import type { Locale } from "@/lib/locale";
import { resolveActiveWorkspace } from "@/server/workspaces/active-workspace";

/** Resolves the canonical workspace-scoped billing URL for the legacy `/dashboard/billing` path. */
export async function resolveLegacyBillingRedirectUrl(
  userId: string,
  locale: Locale,
): Promise<string> {
  const accessible = await getAccessibleWorkspaces(userId);
  const activeId = await resolveActiveWorkspace(userId);

  const target =
    accessible.find(
      (workspace) => workspace.id === activeId && workspace.ownerId === userId,
    ) ?? getFirstOwnedWorkspace(accessible, userId);

  if (target) {
    return `/${locale}/dashboard/${target.slug}/billing`;
  }

  return `/${locale}/dashboard`;
}
