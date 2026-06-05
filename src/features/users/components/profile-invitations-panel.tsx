"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { WorkspaceInvitationCard } from "@/features/workspaces/components/workspace-invitation-card";
import type { Locale } from "@/lib/locale";

const PREVIEW_LIMIT = 3;

export function ProfileInvitationsPanel({
  invitations,
  locale,
}: {
  invitations: ReceivedInvitationView[];
  locale: Locale;
}) {
  const t = useTranslations("workspaces.invitations");
  const preview = invitations.slice(0, PREVIEW_LIMIT);

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="mb-5 space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t("inboxSectionTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("inboxSectionDescription")}</p>
      </div>

      {preview.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
          {t("emptyInbox")}
        </p>
      ) : (
        <div className="space-y-3">
          {preview.map((invitation) => (
            <WorkspaceInvitationCard
              key={invitation.id}
              invitation={invitation}
              locale={locale}
              variant="compact"
            />
          ))}
        </div>
      )}

      {invitations.length > 0 ? (
        <Link
          href={`/${locale}/dashboard/invitations`}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-primary/80"
        >
          {t("seeAllInvitations")}
          <ArrowRight className="size-4" strokeWidth={2} />
        </Link>
      ) : null}
    </section>
  );
}
