import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { toReceivedOwnershipTransferView } from "@/features/workspaces/components/transfer-types";
import { WorkspaceTransferCard } from "@/features/workspaces/components/workspace-transfer-card";
import { findOwnershipTransferByToken } from "@/features/workspaces/server/ownership-transfer";
import { getTransferEligibilitySnapshot } from "@/features/workspaces/server/transfer-eligibility";
import type { Locale } from "@/lib/locale";
import { resolveRequestLocale } from "@/i18n/request-locale";
import { requireAuth } from "@/server/auth/require-auth";

export default async function WorkspaceTransferAcceptPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: localeParam, token } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const transfer = await findOwnershipTransferByToken(token);

  if (!transfer || transfer.status !== "PENDING_RECIPIENT") {
    redirect(`/${resolvedLocale}/dashboard/invitations`);
  }

  if (transfer.expiresAt.getTime() <= Date.now()) {
    redirect(`/${resolvedLocale}/dashboard/invitations`);
  }

  if (transfer.toEmail !== user.email.toLowerCase()) {
    redirect(`/${resolvedLocale}/dashboard/invitations`);
  }

  const eligibility = await getTransferEligibilitySnapshot(transfer.workspaceId);
  const transferView = toReceivedOwnershipTransferView(transfer);

  return (
    <div className="flex min-h-[60vh] w-full justify-center px-3 py-10 sm:px-4">
      <div className="w-full max-w-xl space-y-4">
        {!eligibility.eligible ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {resolvedLocale === "pl"
              ? "Ten transfer nie może zostać zaakceptowany - subskrypcja lub status przestrzeni uległy zmianie."
              : "This transfer can no longer be accepted - the subscription or workspace status has changed."}
          </p>
        ) : null}
        <WorkspaceTransferCard transfer={transferView} locale={resolvedLocale} variant="hero" />
      </div>
    </div>
  );
}
