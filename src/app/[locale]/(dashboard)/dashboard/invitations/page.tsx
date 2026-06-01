import { setRequestLocale } from "next-intl/server";

import { toReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { ReceivedInvitationsInbox } from "@/features/workspaces/components/received-invitations-inbox";
import {
  getNextModalInvitation,
  listReceivedInvitations,
} from "@/features/workspaces/server/invitation-inbox";
import type { Locale } from "@/lib/locale";
import { resolveRequestLocale } from "@/i18n/request-locale";
import { requireAuth } from "@/server/auth/require-auth";

export default async function InvitationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const [invitations, featured] = await Promise.all([
    listReceivedInvitations(user.email),
    getNextModalInvitation(user.email),
  ]);

  const invitationViews = invitations.map(toReceivedInvitationView);

  return (
    <ReceivedInvitationsInbox
      invitations={invitationViews}
      featuredInvitationId={featured?.id}
      locale={resolvedLocale}
      layout="hub"
    />
  );
}
