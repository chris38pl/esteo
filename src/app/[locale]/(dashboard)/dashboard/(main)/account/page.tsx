import { getTranslations, setRequestLocale } from "next-intl/server";

import { toReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { ReceivedInvitationsInbox } from "@/features/workspaces/components/received-invitations-inbox";
import { listReceivedInvitations } from "@/features/workspaces/server/invitation-inbox";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);
  const t = await getTranslations("workspaces.invitations");

  const user = await requireAuth(resolvedLocale);
  const invitations = await listReceivedInvitations(user.email);
  const invitationViews = invitations.map(toReceivedInvitationView);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("profileTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("profileDescription")}</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{t("inboxSectionTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("inboxSectionDescription")}</p>
        </div>

        <ReceivedInvitationsInbox
          invitations={invitationViews}
          locale={resolvedLocale}
          emptyMessage={t("emptyInbox")}
        />
      </section>
    </main>
  );
}
