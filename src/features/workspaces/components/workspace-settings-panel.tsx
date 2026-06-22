"use client";

import type {
  InviteRole,
  WorkspaceAppearanceTheme,
  WorkspaceIndustry,
  WorkspaceRule,
} from "@prisma/client";
import {
  Briefcase,
  Handshake,
  LayoutDashboard,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { WorkspaceSettingsCompanyTab } from "@/features/workspaces/components/workspace-settings-company-tab";
import { WorkspaceAiSetupSection } from "@/features/workspaces/components/workspace-ai-setup-section";
import { WorkspaceSettingsDeleteSection } from "@/features/workspaces/components/workspace-settings-delete-section";
import { WorkspaceSettingsForm } from "@/features/workspaces/components/workspace-settings-form";
import { WorkspaceSettingsReferralTab } from "@/features/workspaces/components/workspace-settings-referral-tab";
import { WorkspaceSettingsRulesTab } from "@/features/workspaces/components/workspace-settings-rules-tab";
import { WorkspaceSettingsUsersTab } from "@/features/workspaces/components/workspace-settings-users-tab";
import { WorkspaceSettingsTransferSection } from "@/features/workspaces/components/workspace-settings-transfer-section";
import type { WorkspaceReferralClaimView } from "@/features/referrals/server/get-workspace-referral-claim-view";
import type {
  PendingOutboundTransferView,
  TransferEligibilityView,
} from "@/features/workspaces/components/transfer-types";
import type { WorkspaceDeleteEligibility } from "@/features/workspaces/lib/workspace-delete-eligibility";
import type { AvatarPreset } from "@/components/avatars/user-avatar";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type SettingsTab = "general" | "company" | "users" | "referral" | "rules";

type MemberRow = {
  id: string;
  userId: string;
  role: "OWNER" | "MEMBER" | "VIEWER";
  joinedAt: string;
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
    avatarPreset: AvatarPreset | null;
  };
};

type InvitationRow = {
  id: string;
  email: string;
  role: InviteRole;
  invitedAt: string;
};

const TABS: SettingsTab[] = ["general", "company", "users", "referral", "rules"];

const TAB_ICONS: Record<SettingsTab, LucideIcon> = {
  general: LayoutDashboard,
  company: Briefcase,
  users: Users,
  referral: Handshake,
  rules: ScrollText,
};

function parseTab(value: string | null): SettingsTab {
  if (
    value === "company" ||
    value === "users" ||
    value === "referral" ||
    value === "rules"
  ) {
    return value;
  }
  return "general";
}

function SettingsTabButton({
  tab,
  isActive,
  label,
  onSelect,
}: {
  tab: SettingsTab;
  isActive: boolean;
  label: string;
  onSelect: (tab: SettingsTab) => void;
}) {
  const Icon = TAB_ICONS[tab];

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onSelect(tab)}
      className={cn(
        "relative flex shrink-0 cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
      {isActive ? (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden />
      ) : null}
    </button>
  );
}

export function WorkspaceSettingsPanel({
  workspaceId,
  workspaceIndustry,
  initialIndustryOtherText,
  initialName,
  initialAppearanceTheme,
  initialCompanyDescription,
  initialCompanyAddress,
  initialCompanyTaxId,
  initialCompanyEmail,
  initialCompanyPhone,
  members,
  invitations,
  rules,
  initialAiInstructions,
  initialBranding,
  canInviteMembers,
  locale,
  workspaceSlug,
  isOwner,
  ownerUserId,
  transferEligibility,
  pendingTransfer,
  deleteEligibility,
  referralClaim = null,
}: {
  workspaceId: string;
  workspaceIndustry: WorkspaceIndustry;
  initialIndustryOtherText: string;
  initialName: string;
  initialAppearanceTheme: WorkspaceAppearanceTheme;
  initialCompanyDescription: string;
  initialCompanyAddress: string;
  initialCompanyTaxId: string;
  initialCompanyEmail: string;
  initialCompanyPhone: string;
  members: MemberRow[];
  invitations: InvitationRow[];
  rules: WorkspaceRule[];
  initialAiInstructions: string;
  initialBranding: WorkspaceBranding | null;
  canInviteMembers: boolean;
  locale: Locale;
  workspaceSlug: string;
  isOwner: boolean;
  ownerUserId: string;
  transferEligibility: TransferEligibilityView;
  pendingTransfer: PendingOutboundTransferView | null;
  deleteEligibility: WorkspaceDeleteEligibility;
  referralClaim?: WorkspaceReferralClaimView | null;
}) {
  const t = useTranslations("workspaces.settings");
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = parseTab(searchParams.get("tab"));
  const activeTab = rawTab === "referral" && !isOwner ? "general" : rawTab;
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
      : activeTab === "company"
        ? t("tabs.companyDescription")
        : activeTab === "users"
          ? t("tabs.usersDescription")
          : activeTab === "referral"
            ? t("tabs.referralDescription")
            : t("tabs.rulesDescription");

  return (
    <div className="flex w-full justify-center px-3 sm:px-4 lg:px-6">
      <div className="w-full max-w-6xl py-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{tabDescription}</p>
        </div>

        <div
          className="mb-8 flex gap-1 overflow-x-auto border-b border-border/60"
          role="tablist"
        >
          {TABS.filter((tab) => tab !== "referral" || isOwner).map((tab) => (
            <SettingsTabButton
              key={tab}
              tab={tab}
              isActive={activeTab === tab}
              label={t(`tabs.${tab}`)}
              onSelect={setTab}
            />
          ))}
        </div>

        {activeTab === "general" ? (
          <>
            <WorkspaceSettingsForm
              workspaceId={workspaceId}
              initialName={initialName}
              initialCompanyDescription={initialCompanyDescription}
              initialLogoUrl={initialBranding?.logoUrl ?? null}
              appearanceTheme={appearanceTheme}
              onAppearanceThemeChange={setAppearanceTheme}
              onPendingChange={setThemePickerDisabled}
              themePickerDisabled={themePickerDisabled}
              locale={locale}
            />
            <WorkspaceAiSetupSection
              workspaceId={workspaceId}
              workspaceIndustry={workspaceIndustry}
              initialIndustryOtherText={initialIndustryOtherText}
              companyDescription={initialCompanyDescription}
              initialBranding={initialBranding}
              rules={rules}
              locale={locale}
            />
            {isOwner ? (
              <WorkspaceSettingsTransferSection
                workspaceId={workspaceId}
                workspaceName={initialName}
                workspaceSlug={workspaceSlug}
                eligibility={transferEligibility}
                pendingTransfer={pendingTransfer}
                locale={locale}
              />
            ) : null}
            <WorkspaceSettingsDeleteSection
              workspaceId={workspaceId}
              workspaceName={initialName}
              locale={locale}
              workspaceSlug={workspaceSlug}
              deleteEligibility={deleteEligibility}
            />
          </>
        ) : null}

        {activeTab === "company" ? (
          <WorkspaceSettingsCompanyTab
            workspaceId={workspaceId}
            initialCompanyAddress={initialCompanyAddress}
            initialCompanyTaxId={initialCompanyTaxId}
            initialCompanyEmail={initialCompanyEmail}
            initialCompanyPhone={initialCompanyPhone}
            locale={locale}
          />
        ) : null}

        {activeTab === "users" ? (
          <WorkspaceSettingsUsersTab
            workspaceId={workspaceId}
            members={members}
            invitations={invitations}
            canInviteMembers={canInviteMembers}
            isOwner={isOwner}
            ownerUserId={ownerUserId}
            locale={locale}
          />
        ) : null}

        {activeTab === "referral" && isOwner ? (
          <WorkspaceSettingsReferralTab
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            locale={locale}
            referralClaim={referralClaim}
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
