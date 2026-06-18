import { setRequestLocale } from "next-intl/server";

import { toReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { DashboardInvitationsHub } from "@/features/workspaces/components/dashboard-invitations-hub";
import { toReceivedOwnershipTransferView } from "@/features/workspaces/components/transfer-types";
import {
  getNextModalInboxItem,
} from "@/features/workspaces/server/inbox-modal";
import { listReceivedInvitations } from "@/features/workspaces/server/invitation-inbox";
import { listReceivedOwnershipTransfers } from "@/features/workspaces/server/transfer-inbox";
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
  const [invitations, nextModalItem, transfers] = await Promise.all([
    listReceivedInvitations(user.email),
    getNextModalInboxItem(user.email),
    listReceivedOwnershipTransfers(user.email),
  ]);

  const invitationViews = invitations.map(toReceivedInvitationView);
  const transferViews = transfers.map(toReceivedOwnershipTransferView);
  const featuredInvitationId =
    nextModalItem?.kind === "invitation" ? nextModalItem.invitation.id : null;

  return (
    <DashboardInvitationsHub
      invitations={invitationViews}
      transfers={transferViews}
      featuredInvitationId={featuredInvitationId}
      locale={resolvedLocale}
    />
  );
}
