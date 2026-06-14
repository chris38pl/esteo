import { setRequestLocale } from "next-intl/server";

import { CreateWorkspacePanel } from "@/features/workspaces/components/create-workspace-panel";
import { prisma } from "@/db/client";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";

export default async function NewWorkspacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);

  // The FREE plan is limited to one active free workspace per owner. When the slot is taken we
  // disable FREE in the picker and offer a link to manage that existing workspace.
  const activeFreeWorkspace = await prisma.workspace.findFirst({
    where: { ownerId: user.id, deletedAt: null, isActiveFree: true },
    select: { slug: true },
  });

  return (
    <CreateWorkspacePanel
      locale={resolvedLocale}
      mode="new"
      layout="embedded"
      freeSlotTaken={Boolean(activeFreeWorkspace)}
      manageFreeWorkspaceSlug={activeFreeWorkspace?.slug ?? null}
    />
  );
}
