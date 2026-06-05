"use client";

import { useTranslations } from "next-intl";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { AvatarPresetPicker } from "@/features/users/components/avatar-preset-picker";
import { ProfileInvitationsPanel } from "@/features/users/components/profile-invitations-panel";
import { ProfileLanguageSelect } from "@/features/users/components/profile-language-select";
import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import type { Locale } from "@/lib/locale";

export function ProfileSettingsTab({
  locale,
  avatarPreset,
  invitations,
}: {
  locale: Locale;
  avatarPreset: AvatarPreset | null;
  invitations: ReceivedInvitationView[];
}) {
  const tMenu = useTranslations("navbar.userMenu");

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
    </div>
  );
}
