"use client";

import { useTranslations } from "next-intl";

import { InvitationsHubShell } from "@/features/workspaces/components/invitations-hub-shell";
import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { WorkspaceInvitationCard } from "@/features/workspaces/components/workspace-invitation-card";
import type { Locale } from "@/lib/locale";

export function ReceivedInvitationsInbox({
  invitations,
  featuredInvitationId,
  locale,
  emptyMessage,
  layout = "default",
}: {
  invitations: ReceivedInvitationView[];
  featuredInvitationId?: string | null;
  locale: Locale;
  emptyMessage?: string;
  layout?: "default" | "hub";
}) {
  const t = useTranslations("workspaces.invitations");

  if (invitations.length === 0) {
    const empty = (
      <p className="rounded-2xl border border-dashed border-border/60 bg-card px-6 py-10 text-center text-sm text-muted-foreground shadow-sm md:rounded-3xl">
        {emptyMessage ?? t("emptyInbox")}
      </p>
    );

    return layout === "hub" ? <InvitationsHubShell>{empty}</InvitationsHubShell> : empty;
  }

  const featuredId = featuredInvitationId ?? invitations[0]?.id;
  const featured = invitations.filter((invitation) => invitation.id === featuredId);
  const others = invitations.filter((invitation) => invitation.id !== featuredId);

  const content = (
    <div className="space-y-6">
      {featured.map((invitation) => (
        <WorkspaceInvitationCard
          key={invitation.id}
          invitation={invitation}
          locale={locale}
          variant={layout === "hub" ? "hero" : "embedded"}
        />
      ))}

      {others.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-center text-sm font-semibold tracking-tight text-foreground">
            {t("otherInvitesTitle")}
          </h2>
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

  return layout === "hub" ? <InvitationsHubShell>{content}</InvitationsHubShell> : content;
}
