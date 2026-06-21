import "server-only";

import { prisma } from "@/db/client";
import { workspaceLocaleToAppLocale } from "@/lib/workspace-locale";
import type { Locale } from "@/lib/locale";

export type WorkspaceNotificationContext = {
  locale: Locale;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
};

export async function loadWorkspaceNotificationContext(
  workspaceId: string,
): Promise<WorkspaceNotificationContext | null> {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: { id: true, name: true, slug: true, defaultLocale: true },
  });

  if (!workspace) {
    return null;
  }

  return {
    locale: workspaceLocaleToAppLocale(workspace.defaultLocale),
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    workspaceName: workspace.name,
  };
}

export function fireNotification(promise: Promise<unknown>): void {
  void promise.catch((error) => {
    console.error("[notifications]", error);
  });
}
