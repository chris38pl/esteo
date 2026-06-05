"use client";

import { Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarSectionLabel } from "./sidebar-section-label";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { teamMembers } from "./team-config";
import { useSidebarStore } from "./sidebar-store";

export function SidebarTeam({ collapsedOverride }: { collapsedOverride?: boolean } = {}) {
  const t = useTranslations("sidebar.team");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const teamOpen = useSidebarStore((s) => s.sectionsOpen.team);
  const toggleSection = useSidebarStore((s) => s.toggleSection);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();
  const { currentUser } = useWorkspaceContext();

  const members = teamMembers.map((member, index) => ({
    ...member,
    imageUrl: index === 0 ? currentUser.avatarUrl : member.imageUrl,
    avatarPreset: index === 0 ? currentUser.avatarPreset : member.avatarPreset,
    displayName:
      index === 0
        ? currentUser.name?.trim() || currentUser.email
        : t(member.nameKey),
  }));

  if (collapsed) {
    return (
      <div className={cn(sidebarInsetClass(true, inDrawer), "pb-2 pt-1")}>
        <ul className="space-y-1">
          {members.slice(0, 3).map((member) => (
            <li key={member.key}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={member.displayName}
                      className="mx-auto flex size-8 items-center justify-center rounded-lg transition hover:bg-[var(--sidebar-nav-hover)]"
                    >
                      <UserAvatar
                        imageUrl={member.imageUrl}
                        avatarPreset={member.avatarPreset}
                        size={24}
                        className="ring-0"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{member.displayName}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={cn(
        sidebarInsetClass(false, inDrawer),
        teamOpen ? "pb-3" : "pb-0",
      )}
    >
      <SidebarSectionLabel
        icon={Users}
        expanded={teamOpen}
        onToggle={() => toggleSection("team")}
        toggleLabel={teamOpen ? t("collapse") : t("expand")}
        action={
          <button
            type="button"
            aria-label={t("invite")}
            className="rounded-md p-0.5 text-[var(--sidebar-section)] transition hover:bg-[var(--sidebar-nav-hover)] hover:text-[var(--sidebar-heading)]"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
          </button>
        }
      >
        {t("title")}
      </SidebarSectionLabel>

      {teamOpen ? (
        <>
          <ul className="space-y-0.5">
            {members.map((member) => (
              <li key={member.key}>
                <button
                  type="button"
                  className="sidebar-nav-link flex w-full items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2 text-left text-xs"
                >
                  <UserAvatar
                    imageUrl={member.imageUrl}
                    avatarPreset={member.avatarPreset}
                    size={22}
                    className="ring-0"
                  />
                  <span className="sidebar-heading min-w-0 flex-1 truncate text-[13px]">
                    {member.displayName}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-1.5 flex w-full items-center gap-1.5 rounded-lg py-1.5 pl-1.5 pr-2 text-xs font-medium text-primary transition hover:bg-[var(--sidebar-nav-hover)]"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            {t("invite")}
          </button>
        </>
      ) : null}
    </div>
  );
}
