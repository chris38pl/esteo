"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import type { ReceivedOwnershipTransferView } from "@/features/workspaces/components/transfer-types";
import { WorkspaceInvitationCard } from "@/features/workspaces/components/workspace-invitation-card";
import { WorkspaceTransferCard } from "@/features/workspaces/components/workspace-transfer-card";
import type { Locale } from "@/lib/locale";

export function ProfileInvitationsPanel({
  invitations,
  transfers,
  locale,
}: {
  invitations: ReceivedInvitationView[];
  transfers: ReceivedOwnershipTransferView[];
  locale: Locale;
}) {
  const t = useTranslations("workspaces.invitations");
  const hasTransfers = transfers.length > 0;
  const hasInvitations = invitations.length > 0;
  const isEmpty = !hasTransfers && !hasInvitations;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="mb-5 space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t("inboxSectionTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("inboxSectionDescription")}</p>
      </div>

      {isEmpty ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("emptyInbox")}
        </p>
      ) : (
        <div className="max-h-[28rem] space-y-4 overflow-y-auto overscroll-contain pr-1">
          {hasTransfers ? (
            <div className="space-y-3">
              {transfers.map((transfer) => (
                <WorkspaceTransferCard
                  key={transfer.id}
                  transfer={transfer}
                  locale={locale}
                  variant="compact"
                />
              ))}
            </div>
          ) : null}

          {hasInvitations ? (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <WorkspaceInvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  locale={locale}
                  variant="compact"
                />
              ))}
            </div>
          ) : null}
        </div>
      )}

      {!isEmpty ? (
        <div className="mt-4">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={`/${locale}/dashboard/invitations`}>{t("seeAllInvitations")}</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
