import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setRequestLocale } from "next-intl/server";

import { toReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { WorkspaceInvitationCard } from "@/features/workspaces/components/workspace-invitation-card";
import { isPendingInvitationForRecipient } from "@/features/workspaces/lib/invitation-token-access";
import { resolveInvitationNotification } from "@/features/notifications/server/resolve-notification";
import {
  acceptWorkspaceInvitationAction,
  declineReceivedInvitationAction,
} from "@/features/workspaces/server/actions";import { findInvitationByToken } from "@/features/workspaces/server/repository";
import { resolveRequestLocale } from "@/i18n/request-locale";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";

function invitationsHubHref(locale: Locale, query?: Record<string, string>) {
  const params = new URLSearchParams(query);
  const suffix = params.toString();
  return `/${locale}/dashboard/invitations${suffix ? `?${suffix}` : ""}`;
}

export default async function WorkspaceInvitationTokenPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ action?: string }>;
}) {
  const { locale: localeParam, token } = await params;
  const { action } = await searchParams;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const invitation = await findInvitationByToken(token);

  if (!invitation) {
    redirect(
      invitationsHubHref(resolvedLocale, {
        inviteError: "not_found",
      }),
    );
  }

  const isPending = isPendingInvitationForRecipient(
    {
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      workspace: { deletedAt: invitation.workspace.deletedAt },
    },
    user.email,
  );

  if (!isPending) {
    await resolveInvitationNotification(invitation.id);
    revalidatePath(`/${resolvedLocale}/dashboard`, "layout");

    if (invitation.status === "ACCEPTED") {
      redirect(
        `${dashboardEstimatesHref(resolvedLocale, invitation.workspace.slug)}?inviteAccepted=1`,
      );
    }

    redirect(
      invitationsHubHref(resolvedLocale, {
        inviteError: "invalid",
      }),
    );
  }

  if (action === "accept") {    const result = await acceptWorkspaceInvitationAction(token, resolvedLocale);

    if (!result.success) {
      redirect(
        invitationsHubHref(resolvedLocale, {
          inviteError: result.code ?? "generic",
        }),
      );
    }

    redirect(
      `${dashboardEstimatesHref(resolvedLocale, invitation.workspace.slug)}?inviteAccepted=1`,
    );
  }

  if (action === "decline") {
    const result = await declineReceivedInvitationAction(invitation.id, resolvedLocale);

    if (!result.success) {
      redirect(
        invitationsHubHref(resolvedLocale, {
          inviteError: result.code ?? "generic",
        }),
      );
    }

    redirect(invitationsHubHref(resolvedLocale, { inviteDeclined: "1" }));
  }

  const invitationView = toReceivedInvitationView(invitation);

  return (
    <div className="flex min-h-[60vh] w-full justify-center px-3 py-10 sm:px-4">
      <div className="w-full max-w-xl">
        <WorkspaceInvitationCard
          invitation={invitationView}
          locale={resolvedLocale}
          variant="hero"
        />
      </div>
    </div>
  );
}
