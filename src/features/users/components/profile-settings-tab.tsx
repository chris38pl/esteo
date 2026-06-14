"use client";

import { useTranslations } from "next-intl";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { AvatarPresetPicker } from "@/features/users/components/avatar-preset-picker";
import { ProfileInvitationsPanel } from "@/features/users/components/profile-invitations-panel";
import { ProfileLanguageSelect } from "@/features/users/components/profile-language-select";
import type { OwnedWorkspaceBlockingDeletion } from "@/features/users/server/account-deletion-guard";
import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import type { Locale } from "@/lib/locale";

export function ProfileSettingsTab({
  locale,
  avatarPreset,
  invitations,
  ownedWorkspacesBlockingDeletion,
}: {
  locale: Locale;
  avatarPreset: AvatarPreset | null;
  invitations: ReceivedInvitationView[];
  ownedWorkspacesBlockingDeletion: OwnedWorkspaceBlockingDeletion[];
}) {
  const tMenu = useTranslations("navbar.userMenu");
  const tAccount = useTranslations("navbar.userMenu.deletionGuard");

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-6 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {tMenu("myProfile")}
          </h2>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">{tMenu("avatarLabel")}</p>
              <p className="text-xs text-muted-foreground">{tMenu("avatarHint")}</p>
            </div>
            <AvatarPresetPicker locale={locale} selectedPreset={avatarPreset} />
          </div>

          <ProfileLanguageSelect locale={locale} />
        </div>
      </section>

      <ProfileInvitationsPanel invitations={invitations} locale={locale} />

      {ownedWorkspacesBlockingDeletion.length > 0 ? (
        <section className="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-6 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">{tAccount("title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{tAccount("description")}</p>
          <ul className="mt-3 space-y-1 text-sm">
            {ownedWorkspacesBlockingDeletion.map((workspace) => (
              <li key={workspace.id}>
                {workspace.name} ({workspace.slug}) — {workspace.plan}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
