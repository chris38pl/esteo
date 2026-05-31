import { setRequestLocale } from "next-intl/server";

import { toReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { ReceivedInvitationsInbox } from "@/features/workspaces/components/received-invitations-inbox";
import {
  getNextModalInvitation,
  listReceivedInvitations,
} from "@/features/workspaces/server/invitation-inbox";
import { getServerTranslations, resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";

export default async function InvitationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);
  const t = await getServerTranslations(resolvedLocale, "workspaces.invitations");

  const user = await requireAuth(resolvedLocale);
  const [invitations, featured] = await Promise.all([
    listReceivedInvitations(user.email),
    getNextModalInvitation(user.email),
  ]);

  const invitationViews = invitations.map(toReceivedInvitationView);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("hubTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("hubDescription")}</p>
      </div>

      <ReceivedInvitationsInbox
        invitations={invitationViews}
        featuredInvitationId={featured?.id}
        locale={resolvedLocale}
      />
    </main>
  );
}
