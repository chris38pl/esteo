"use client";

import type {
  WorkspaceAppearanceTheme,
  WorkspaceIndustry,
  WorkspaceInvitation,
  WorkspaceRule,
} from "@prisma/client";

import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { WorkspaceSettingsDeleteSection } from "@/features/workspaces/components/workspace-settings-delete-section";
import { WorkspaceSettingsForm } from "@/features/workspaces/components/workspace-settings-form";
import { WorkspaceSettingsRulesTab } from "@/features/workspaces/components/workspace-settings-rules-tab";
import { WorkspaceSettingsUsersTab } from "@/features/workspaces/components/workspace-settings-users-tab";
import { WorkspaceThemePicker } from "@/features/workspaces/components/workspace-theme-picker";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type SettingsTab = "general" | "users" | "rules";

type MemberRow = {
  id: string;
  role: "OWNER" | "MEMBER" | "VIEWER";
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

const TABS: SettingsTab[] = ["general", "users", "rules"];

function parseTab(value: string | null): SettingsTab {
  if (value === "users" || value === "rules") {
    return value;
  }
  return "general";
}

export function WorkspaceSettingsPanel({
  workspaceId,
  workspaceIndustry,
  initialName,
  initialAppearanceTheme,
  initialCompanyDescription,
  members,
  invitations,
  rules,
  initialAiInstructions,
  initialBranding,
  canInviteMembers,
  locale,
}: {
  workspaceId: string;
  workspaceIndustry: WorkspaceIndustry;
  initialName: string;
  initialAppearanceTheme: WorkspaceAppearanceTheme;
  initialCompanyDescription: string;
  members: MemberRow[];
  invitations: WorkspaceInvitation[];
  rules: WorkspaceRule[];
  initialAiInstructions: string;
  initialBranding: WorkspaceBranding | null;
  canInviteMembers: boolean;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings");
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));
  const [appearanceTheme, setAppearanceTheme] = useState(initialAppearanceTheme);
  const [themePickerDisabled, setThemePickerDisabled] = useState(false);

  useEffect(() => {
    setAppearanceTheme(initialAppearanceTheme);
  }, [initialAppearanceTheme]);

  function setTab(tab: SettingsTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "general") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  const tabDescription =
    activeTab === "general"
      ? t("description")
      : activeTab === "users"
        ? t("tabs.usersDescription")
        : t("tabs.rulesDescription");

  return (
    <div className="flex w-full justify-center px-3 sm:px-4 lg:px-6">
      <div
        className={cn(
          "w-full py-8",
          activeTab === "rules" ? "max-w-5xl" : "max-w-[560px]",
        )}
      >
        <div className="mb-6 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            {activeTab === "general" ? (
              <div className="shrink-0">
                <WorkspaceThemePicker
                  variant="header"
                  value={appearanceTheme}
                  onChange={setAppearanceTheme}
                  disabled={themePickerDisabled}
                />
              </div>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{tabDescription}</p>
        </div>

        <div className="mb-8 flex gap-1 border-b border-border/60">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTab(tab)}
              className={cn(
                "cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {activeTab === "general" ? (
          <>
            <WorkspaceSettingsForm
              workspaceId={workspaceId}
              initialName={initialName}
              initialCompanyDescription={initialCompanyDescription}
              appearanceTheme={appearanceTheme}
              onPendingChange={setThemePickerDisabled}
              locale={locale}
            />
            <WorkspaceSettingsDeleteSection
              workspaceId={workspaceId}
              workspaceName={initialName}
              locale={locale}
            />
          </>
        ) : null}

        {activeTab === "users" ? (
          <WorkspaceSettingsUsersTab
            workspaceId={workspaceId}
            members={members}
            invitations={invitations}
            canInviteMembers={canInviteMembers}
            locale={locale}
          />
        ) : null}

        {activeTab === "rules" ? (
          <WorkspaceSettingsRulesTab
            workspaceId={workspaceId}
            workspaceIndustry={workspaceIndustry}
            rules={rules}
            initialAiInstructions={initialAiInstructions}
            initialBranding={initialBranding}
            locale={locale}
          />
        ) : null}
      </div>
    </div>
  );
}
