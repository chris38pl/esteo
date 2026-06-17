"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { ProfileSettingsTab } from "@/features/users/components/profile-settings-tab";
import { SettingsUpgradeBanner } from "@/features/users/components/settings-upgrade-banner";
import { UserSettingsBillingTab } from "@/features/users/components/user-settings-billing-tab";
import { UserSettingsNotificationsTab } from "@/features/users/components/user-settings-notifications-tab";
import type { OwnedWorkspaceBlockingDeletion } from "@/features/users/server/account-deletion-guard";
import type { UserBillingInvoiceItem } from "@/features/users/server/get-user-billing-invoices";
import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import type { ReceivedOwnershipTransferView } from "@/features/workspaces/components/transfer-types";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "billing" | "notifications";

const TABS: SettingsTab[] = ["profile", "billing", "notifications"];

function parseTab(value: string | null): SettingsTab {
  if (value === "billing" || value === "notifications") {
    return value;
  }
  return "profile";
}

export function UserSettingsPanel({
  locale,
  avatarPreset,
  invitations,
  transfers,
  ownedWorkspacesBlockingDeletion,
  invoices,
}: {
  locale: Locale;
  avatarPreset: AvatarPreset | null;
  invitations: ReceivedInvitationView[];
  transfers: ReceivedOwnershipTransferView[];
  ownedWorkspacesBlockingDeletion: OwnedWorkspaceBlockingDeletion[];
  invoices: UserBillingInvoiceItem[];
}) {
  const tSidebar = useTranslations("sidebar.settings");
  const tInvitations = useTranslations("workspaces.invitations");
  const tNavbar = useTranslations("navbar");
  const tMenu = useTranslations("navbar.userMenu");
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  function setTab(tab: SettingsTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  function tabLabel(tab: SettingsTab) {
    switch (tab) {
      case "profile":
        return tMenu("myProfile");
      case "billing":
        return tNavbar("breadcrumbs.billing");
      case "notifications":
        return tNavbar("notifications.label");
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{tSidebar("title")}</h1>
        <p className="text-sm text-muted-foreground">{tInvitations("profileDescription")}</p>
      </div>

      <div className="mb-8">
        <SettingsUpgradeBanner />
      </div>

      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-border/60">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setTab(tab)}
            className={cn(
              "cursor-pointer shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {activeTab === "profile" ? (
        <ProfileSettingsTab
          locale={locale}
          avatarPreset={avatarPreset}
          invitations={invitations}
          transfers={transfers}
          ownedWorkspacesBlockingDeletion={ownedWorkspacesBlockingDeletion}
        />
      ) : null}
      {activeTab === "billing" ? (
        <UserSettingsBillingTab invoices={invoices} locale={locale} />
      ) : null}
      {activeTab === "notifications" ? <UserSettingsNotificationsTab /> : null}
    </main>
  );
}
