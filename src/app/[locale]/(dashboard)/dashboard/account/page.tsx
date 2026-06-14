import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import { UserSettingsPanel } from "@/features/users/components/user-settings-panel";
import { getUserSettingsPageData } from "@/features/users/server/get-user-settings-page-data";
import { resolveRequestLocale } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const resolvedLocale: Locale = await resolveRequestLocale(localeParam);

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const { profile, invitations, ownedWorkspacesBlockingDeletion } =
    await getUserSettingsPageData(user);

  return (
    <Suspense>
      <UserSettingsPanel
        locale={resolvedLocale}
        avatarPreset={profile.avatarPreset}
        invitations={invitations}
        ownedWorkspacesBlockingDeletion={ownedWorkspacesBlockingDeletion}
      />
    </Suspense>
  );
}
