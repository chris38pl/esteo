"use client";

import { useTranslations } from "next-intl";

import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { WorkspaceInvitationCard } from "@/features/workspaces/components/workspace-invitation-card";
import type { Locale } from "@/lib/locale";

export function ProfileInvitationsPanel({
  invitations,
  locale,
}: {
  invitations: ReceivedInvitationView[];
  locale: Locale;
}) {
  const t = useTranslations("workspaces.invitations");

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="mb-5 space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t("inboxSectionTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("inboxSectionDescription")}</p>
      </div>

      {invitations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("emptyInbox")}
        </p>
      ) : (
        <div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1">
          {invitations.map((invitation) => (
            <WorkspaceInvitationCard
              key={invitation.id}
              invitation={invitation}
              locale={locale}
              variant="compact"
            />
          ))}
        </div>
      )}
    </section>
  );
}
