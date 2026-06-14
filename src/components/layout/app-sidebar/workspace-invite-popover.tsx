"use client";

import type { InviteRole } from "@prisma/client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INVITE_ROLES } from "@/features/workspaces/lib/invite-role";
import { inviteWorkspaceMemberAction } from "@/features/workspaces/server/actions";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { dashboardUpgradeHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

export function WorkspaceInvitePopover({
  workspaceId,
  locale,
  canInviteMembers,
  avatarSize,
  inviteIconSize,
  surface,
}: {
  workspaceId: string;
  locale: Locale;
  canInviteMembers: boolean;
  avatarSize: number;
  inviteIconSize: number;
  surface: "hero" | "panel";
}) {
  const tSidebar = useTranslations("sidebar.workspaceCard");
  const t = useTranslations("workspaces.settings.users");
  const router = useRouter();
  const { activeWorkspace, workspaces } = useWorkspaceContext();
  const businessUpgradeHref =
    activeWorkspace?.isOwner && activeWorkspace.slug
      ? dashboardUpgradeHref(locale, activeWorkspace.slug, { plan: "BUSINESS" })
      : (() => {
          const owned = workspaces.find((workspace) => workspace.isOwner);
          return owned ? dashboardUpgradeHref(locale, owned.slug, { plan: "BUSINESS" }) : null;
        })();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const onHero = surface === "hero";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await inviteWorkspaceMemberAction(
        workspaceId,
        { email: email.trim(), role },
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setEmail("");
      setRole("MEMBER");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={tSidebar("inviteMember")}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full ring-[1.5px]",
            onHero
              ? "border border-dashed border-white/70 bg-white/95 text-slate-800 ring-white/90 hover:border-slate-400 hover:bg-white hover:text-slate-900 focus-visible:ring-white/80"
              : "border border-dashed border-border/65 bg-card text-muted-foreground ring-card hover:border-border hover:bg-accent/40 hover:text-foreground focus-visible:ring-ring/40",
            "transition-colors focus-visible:outline-none focus-visible:ring-2",
            open && (onHero ? "border-slate-400 bg-white" : "border-border bg-accent/40"),
          )}
          style={{ width: avatarSize, height: avatarSize }}
          onClick={(event) => event.stopPropagation()}
        >
          <Plus style={{ width: inviteIconSize, height: inviteIconSize }} strokeWidth={2.25} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[min(16.5rem,calc(100vw-2rem))] p-3"
        onClick={(event) => event.stopPropagation()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {canInviteMembers ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm font-medium leading-tight">{t("inviteTitle")}</p>

            <div className="space-y-1.5">
              <Label htmlFor="sidebar-workspace-invite-email" className="text-xs">
                {t("emailLabel")}
              </Label>
              <Input
                id="sidebar-workspace-invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                disabled={isPending}
                className="h-9 rounded-lg text-sm"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sidebar-workspace-invite-role" className="text-xs">
                {t("roleLabel")}
              </Label>
              <select
                id="sidebar-workspace-invite-role"
                value={role}
                onChange={(event) => setRole(event.target.value as InviteRole)}
                disabled={isPending}
                className={selectClassName}
              >
                {INVITE_ROLES.map((inviteRole) => (
                  <option key={inviteRole} value={inviteRole}>
                    {t(`roles.${inviteRole}`)}
                  </option>
                ))}
              </select>
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="sm" className="h-8 w-full rounded-lg" disabled={isPending}>
              {isPending ? t("inviting") : t("inviteSubmit")}
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium leading-tight">{t("inviteTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("inviteUpgradeDescription")}</p>
            {businessUpgradeHref ? (
              <Link
                href={businessUpgradeHref}
                className="inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => setOpen(false)}
              >
                {t("inviteUpgradeCta")}
              </Link>
            ) : null}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
