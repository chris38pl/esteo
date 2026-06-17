"use client";

import { useTranslations } from "next-intl";

import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { InvitationsHubShell } from "@/features/workspaces/components/invitations-hub-shell";
import { ReceivedInvitationsInbox } from "@/features/workspaces/components/received-invitations-inbox";
import type { ReceivedOwnershipTransferView } from "@/features/workspaces/components/transfer-types";
import { WorkspaceTransferCard } from "@/features/workspaces/components/workspace-transfer-card";
import type { Locale } from "@/lib/locale";

export function DashboardInvitationsHub({
  invitations,
  transfers,
  featuredInvitationId,
  locale,
}: {
  invitations: ReceivedInvitationView[];
  transfers: ReceivedOwnershipTransferView[];
  featuredInvitationId?: string | null;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.transfer");

  const hasInvitations = invitations.length > 0;
  const hasTransfers = transfers.length > 0;

  if (!hasInvitations && !hasTransfers) {
    return (
      <ReceivedInvitationsInbox
        invitations={[]}
        featuredInvitationId={featuredInvitationId}
        locale={locale}
        layout="hub"
      />
    );
  }

  return (
    <InvitationsHubShell>
      <div className="space-y-10">
        {hasTransfers ? (
          <section className="space-y-4">
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-semibold tracking-tight">{t("inboxTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("inboxDescription")}</p>
            </div>
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <WorkspaceTransferCard
                  key={transfer.id}
                  transfer={transfer}
                  locale={locale}
                  variant={transfers.length === 1 && !hasInvitations ? "hero" : "card"}
                />
              ))}
            </div>
          </section>
        ) : null}

        {hasInvitations ? (
          <ReceivedInvitationsInbox
            invitations={invitations}
            featuredInvitationId={featuredInvitationId}
            locale={locale}
            layout="default"
          />
        ) : null}
      </div>
    </InvitationsHubShell>
  );
}
