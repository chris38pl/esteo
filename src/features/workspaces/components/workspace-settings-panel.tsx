"use client";

import type {
  InviteRole,
  WorkspaceIndustry,
  WorkspaceRule,
} from "@prisma/client";
import {
  Briefcase,
  Handshake,
  LayoutDashboard,
  MoreHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { TopBarLoadingIndicator } from "@/components/layout/top-bar-loading-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkspaceSettingsCompanyTab } from "@/features/workspaces/components/workspace-settings-company-tab";
import { WorkspaceSettingsForm } from "@/features/workspaces/components/workspace-settings-form";
import { WorkspaceSettingsDeleteSection } from "@/features/workspaces/components/workspace-settings-delete-section";
import { WorkspaceAiSetupCardCompact } from "@/features/workspaces/components/workspace-ai-setup-card-compact";
import { WorkspaceSettingsManagementCard } from "@/features/workspaces/components/workspace-settings-management-card";
import { WorkspaceSettingsReferralTab } from "@/features/workspaces/components/workspace-settings-referral-tab";
import { WorkspaceSettingsUsersTab } from "@/features/workspaces/components/workspace-settings-users-tab";
import type { WorkspaceReferralClaimView } from "@/features/referrals/server/get-workspace-referral-claim-view";
import type {
  PendingOutboundTransferView,
  TransferEligibilityView,
} from "@/features/workspaces/components/transfer-types";
import type { WorkspaceDeleteEligibility } from "@/features/workspaces/lib/workspace-delete-eligibility";
import type { AvatarPreset } from "@/components/avatars/user-avatar";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import {
  AI_SETUP_FOCUS_PARAM,
  isAiSetupFocusField,
} from "@/features/workspaces/lib/ai-setup-focus";
import { useAiSetupFieldFocus } from "@/features/workspaces/hooks/use-ai-setup-field-focus";

type SettingsTab = "general" | "company" | "users" | "referral";

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

const TABS: SettingsTab[] = ["general", "company", "users", "referral"];

const MOBILE_PRIMARY_TABS: SettingsTab[] = ["general", "company"];

const TAB_ICONS: Record<SettingsTab, LucideIcon> = {
  general: LayoutDashboard,
  company: Briefcase,
  users: Users,
  referral: Handshake,
};

function parseTab(value: string | null): SettingsTab {
  if (
    value === "company" ||
    value === "users" ||
    value === "referral"
  ) {
    return value;
  }
  return "general";
}

function resolveActiveTab(value: string | null, isOwner: boolean): SettingsTab {
  const raw = parseTab(value);
  return raw === "referral" && !isOwner ? "general" : raw;
}

function resolveTabForFocus(focus: string | null): SettingsTab | null {
  if (focus === "businessType" || focus === "companyDescription") {
    return "general";
  }
  return null;
}

function getVisibleTabs(isOwner: boolean): SettingsTab[] {
  return TABS.filter((tab) => tab !== "referral" || isOwner);
}

function getMobileOverflowTabs(isOwner: boolean): SettingsTab[] {
  const overflow: SettingsTab[] = ["users"];
  if (isOwner) {
    overflow.push("referral");
  }
  return overflow;
}

function SettingsTabButton({
  tab,
  isActive,
  label,
  disabled,
  compact = false,
  onSelect,
}: {
  tab: SettingsTab;
  isActive: boolean;
  label: string;
  disabled?: boolean;
  compact?: boolean;
  onSelect: (tab: SettingsTab) => void;
}) {
  const Icon = TAB_ICONS[tab];

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => onSelect(tab)}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 py-3 text-sm font-medium transition-colors",
        compact
          ? "min-w-0 flex-1 justify-center px-2"
          : "shrink-0 px-4",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        disabled && "pointer-events-none opacity-70",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className={cn(compact && "truncate")}>{label}</span>
      {isActive ? (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden />
      ) : null}
    </button>
  );
}

function SettingsTabOverflowMenu({
  tabs,
  activeTab,
  disabled,
  moreLabel,
  tabLabel,
  onSelect,
}: {
  tabs: SettingsTab[];
  activeTab: SettingsTab;
  disabled?: boolean;
  moreLabel: string;
  tabLabel: (tab: SettingsTab) => string;
  onSelect: (tab: SettingsTab) => void;
}) {
  const isOverflowActive = tabs.includes(activeTab);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          role="tab"
          aria-selected={isOverflowActive}
          disabled={disabled}
          className={cn(
            "relative flex shrink-0 cursor-pointer items-center justify-center px-3 py-3 text-sm font-medium transition-colors",
            isOverflowActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            disabled && "pointer-events-none opacity-70",
          )}
          aria-label={moreLabel}
        >
          <MoreHorizontal className="size-5" aria-hidden />
          {isOverflowActive ? (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab];

          return (
            <DropdownMenuItem
              key={tab}
              onClick={() => onSelect(tab)}
              className={cn(
                "gap-2",
                activeTab === tab && "bg-accent font-medium text-primary",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {tabLabel(tab)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkspaceSettingsTabList({
  activeTab,
  disabled,
  isOwner,
  moreLabel,
  tabLabel,
  onSelect,
}: {
  activeTab: SettingsTab;
  disabled?: boolean;
  isOwner: boolean;
  moreLabel: string;
  tabLabel: (tab: SettingsTab) => string;
  onSelect: (tab: SettingsTab) => void;
}) {
  const visibleTabs = getVisibleTabs(isOwner);
  const mobileOverflowTabs = getMobileOverflowTabs(isOwner);

  return (
    <div className="mb-8 border-b border-border/60" role="tablist">
      <div className="flex min-w-0 items-stretch md:hidden">
        {MOBILE_PRIMARY_TABS.map((tab) => (
          <SettingsTabButton
            key={tab}
            tab={tab}
            isActive={activeTab === tab}
            label={tabLabel(tab)}
            disabled={disabled}
            compact
            onSelect={onSelect}
          />
        ))}
        <SettingsTabOverflowMenu
          tabs={mobileOverflowTabs}
          activeTab={activeTab}
          disabled={disabled}
          moreLabel={moreLabel}
          tabLabel={tabLabel}
          onSelect={onSelect}
        />
      </div>

      <div className="hidden min-w-0 md:flex">
        {visibleTabs.map((tab) => (
          <SettingsTabButton
            key={tab}
            tab={tab}
            isActive={activeTab === tab}
            label={tabLabel(tab)}
            disabled={disabled}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceSettingsPanel({
  workspaceId,
  workspaceIndustry,
  initialIndustryOtherText,
  initialName,
  initialCompanyDescription,
  initialCompanyAddress,
  initialCompanyTaxId,
  initialCompanyEmail,
  initialCompanyPhone,
  members,
  invitations,
  rules,
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
  initialCompanyDescription: string;
  initialCompanyAddress: string;
  initialCompanyTaxId: string;
  initialCompanyEmail: string;
  initialCompanyPhone: string;
  members: MemberRow[];
  invitations: InvitationRow[];
  rules: WorkspaceRule[];
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const focusParam = searchParams.get(AI_SETUP_FOCUS_PARAM);
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const focusTab = isAiSetupFocusField(focusParam) ? resolveTabForFocus(focusParam) : null;
    return focusTab ?? resolveActiveTab(searchParams.get("tab"), isOwner);
  });
  const [isTabPending, startTabTransition] = useTransition();

  useAiSetupFieldFocus();

  useEffect(() => {
    const focusTab = isAiSetupFocusField(focusParam) ? resolveTabForFocus(focusParam) : null;
    setActiveTab(focusTab ?? resolveActiveTab(searchParams.get("tab"), isOwner));
  }, [focusParam, searchParams, isOwner]);

  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      startTabTransition(() => {
        setActiveTab(resolveActiveTab(params.get("tab"), isOwner));
      });
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOwner]);

  const setTab = useCallback(
    (tab: SettingsTab) => {
      if (tab === activeTab) {
        return;
      }

      startTabTransition(() => {
        setActiveTab(tab);

        const params = new URLSearchParams(window.location.search);
        if (tab === "general") {
          params.delete("tab");
        } else {
          params.set("tab", tab);
        }

        const query = params.toString();
        const nextUrl = query ? `${pathname}?${query}` : pathname;
        window.history.replaceState(window.history.state, "", nextUrl);
      });
    },
    [activeTab, pathname],
  );

  const tabDescription =
    activeTab === "general"
      ? t("description")
      : activeTab === "company"
        ? t("tabs.companyDescription")
        : activeTab === "users"
          ? t("tabs.usersDescription")
          : t("tabs.referralDescription");

  return (
    <>
      <TopBarLoadingIndicator active={isTabPending} label={t("tabLoading")} />
      <div className="flex w-full justify-center px-3 sm:px-4 lg:px-6">
        <div className="w-full max-w-6xl py-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{tabDescription}</p>
        </div>

        <WorkspaceAiSetupCardCompact
          workspaceIndustry={workspaceIndustry}
          industryOtherText={initialIndustryOtherText}
          companyDescription={initialCompanyDescription}
          initialBranding={initialBranding}
          rules={rules}
          locale={locale}
          workspaceSlug={workspaceSlug}
        />

        <WorkspaceSettingsTabList
          activeTab={activeTab}
          disabled={isTabPending}
          isOwner={isOwner}
          moreLabel={t("tabs.more")}
          tabLabel={(tab) => t(`tabs.${tab}`)}
          onSelect={setTab}
        />

        {activeTab === "general" ? (
          <>
            <WorkspaceSettingsForm
              workspaceId={workspaceId}
              workspaceIndustry={workspaceIndustry}
              industryOtherText={initialIndustryOtherText}
              initialName={initialName}
              initialCompanyDescription={initialCompanyDescription}
              initialLogoUrl={initialBranding?.logoUrl ?? null}
              locale={locale}
            />
            {isOwner ? (
              <WorkspaceSettingsManagementCard
                workspaceId={workspaceId}
                workspaceName={initialName}
                workspaceSlug={workspaceSlug}
                locale={locale}
                transferEligibility={transferEligibility}
                pendingTransfer={pendingTransfer}
                deleteEligibility={deleteEligibility}
              />
            ) : (
              <WorkspaceSettingsDeleteSection
                workspaceId={workspaceId}
                workspaceName={initialName}
                locale={locale}
                workspaceSlug={workspaceSlug}
                deleteEligibility={deleteEligibility}
                currentPeriodEnd={transferEligibility.currentPeriodEnd}
              />
            )}
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
        </div>
      </div>
    </>
  );
}
