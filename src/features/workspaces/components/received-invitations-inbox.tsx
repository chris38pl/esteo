"use client";

import { useTranslations } from "next-intl";

import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { WorkspaceInvitationCard } from "@/features/workspaces/components/workspace-invitation-card";
import type { Locale } from "@/lib/locale";

export function ReceivedInvitationsInbox({
  invitations,
  featuredInvitationId,
  locale,
  emptyMessage,
}: {
  invitations: ReceivedInvitationView[];
  featuredInvitationId?: string | null;
  locale: Locale;
  emptyMessage?: string;
}) {
  const t = useTranslations("workspaces.invitations");

  if (invitations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
        {emptyMessage ?? t("emptyInbox")}
      </p>
    );
  }

  const featuredId = featuredInvitationId ?? invitations[0]?.id;
  const others = invitations.filter((invitation) => invitation.id !== featuredId);

  return (
    <div className="space-y-6">
      {invitations
        .filter((invitation) => invitation.id === featuredId)
        .map((invitation) => (
          <WorkspaceInvitationCard
            key={invitation.id}
            invitation={invitation}
            locale={locale}
            variant="embedded"
          />
        ))}

      {others.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">{t("otherInvitesTitle")}</h2>
          {others.map((invitation) => (
            <WorkspaceInvitationCard
              key={invitation.id}
              invitation={invitation}
              locale={locale}
              variant="card"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
