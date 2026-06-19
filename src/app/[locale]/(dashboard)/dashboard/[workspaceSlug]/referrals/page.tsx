import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { PartnerProgramPanel } from "@/features/referrals/components/partner-program-panel";
import { getPartnerProgramPageData } from "@/features/referrals/server/get-partner-program-page-data";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function PartnerProgramPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  const isOwner = resolved.workspace.ownerId === user.id;
  if (!isOwner) {
    redirect(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}`);
  }

  const data = await getPartnerProgramPageData({
    ownerUserId: user.id,
    contextWorkspaceId: resolved.workspace.id,
  });

  if (!data) {
    redirect(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/billing`);
  }

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-[1400px] flex-1 flex-col pb-8">
      <PartnerProgramPanel
        locale={resolvedLocale}
        workspaceId={resolved.workspace.id}
        workspaceSlug={resolved.canonicalSlug}
        data={data}
      />
    </div>
  );
}
