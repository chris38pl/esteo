"use client";

import type { InviteRole, WorkspaceRole } from "@prisma/client";
import { ChevronDown, MoreHorizontal, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { UserAvatar } from "@/components/avatars/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkspaceSettingsCard } from "@/features/workspaces/components/workspace-settings-card";
import { appToast } from "@/components/ui/app-toast";
import { INVITE_ROLES } from "@/features/workspaces/lib/invite-role";
import { RemoveWorkspaceMemberDialog } from "@/features/workspaces/components/remove-workspace-member-dialog";
import {
  inviteWorkspaceMemberAction,
  revokeWorkspaceInvitationAction,
} from "@/features/workspaces/server/actions";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { formatDate } from "@/i18n/formatters";
import { dashboardBillingHref, ownedWorkspaceBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type MemberRow = {
  id: string;
  userId: string;
  role: WorkspaceRole;
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

type MemberToRemove = {
  userId: string;
  name: string;
};

type UserTableRow =
  | {
      kind: "member";
      id: string;
      userId: string;
      role: WorkspaceRole;
      joinedAt: string;
      displayName: string;
      email: string;
      avatarUrl: string | null;
      avatarPreset: AvatarPreset | null;
    }
  | {
      kind: "invitation";
      id: string;
      role: InviteRole;
      joinedAt: string;
      email: string;
    };

type RoleFilter = "ALL" | WorkspaceRole | InviteRole;

const selectClassName = cn(
  "h-11 w-full appearance-none rounded-xl border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

const AVATAR_COLORS = [
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
];

function emailInitials(email: string) {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

function avatarColorClass(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function sortUserRows(rows: UserTableRow[]) {
  return [...rows].sort((left, right) => {
    const leftIsOwner = left.kind === "member" && left.role === "OWNER";
    const rightIsOwner = right.kind === "member" && right.role === "OWNER";

    if (leftIsOwner !== rightIsOwner) {
      return leftIsOwner ? -1 : 1;
    }

    return new Date(left.joinedAt).getTime() - new Date(right.joinedAt).getTime();
  });
}

function RolePill({ role, label }: { role: WorkspaceRole | InviteRole; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        role === "OWNER" && "bg-violet-500/15 text-violet-700 dark:text-violet-300",
        role === "MEMBER" && "border border-border/70 bg-muted/40 text-foreground",
        role === "VIEWER" && "bg-sky-500/15 text-sky-700 dark:text-sky-300",
      )}
    >
      {label}
      <ChevronDown className="size-3 opacity-60 md:inline" aria-hidden />
    </span>
  );
}

function StatusBadge({ status, label }: { status: "active" | "pending"; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "active" ? "bg-emerald-500" : "bg-amber-500",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}

function PendingAvatar({ email }: { email: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        avatarColorClass(email),
      )}
      aria-hidden
    >
      {emailInitials(email)}
    </span>
  );
}

function WorkspaceUserMobileCard({
  row,
  locale,
  isOwner,
  ownerUserId,
  isPending,
  t,
  onRemove,
  onRevoke,
}: {
  row: UserTableRow;
  locale: Locale;
  isOwner: boolean;
  ownerUserId: string;
  isPending: boolean;
  t: ReturnType<typeof useTranslations<"workspaces.settings.users">>;
  onRemove: (member: MemberToRemove) => void;
  onRevoke: (invitationId: string) => void;
}) {
  const joinedLabel = formatDate(row.joinedAt, locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (row.kind === "member") {
    const canRemove = isOwner && row.userId !== ownerUserId;

    return (
      <article className="rounded-lg border border-border/60 px-4 py-4">
        <div className="flex items-start gap-3">
          <UserAvatar
            imageUrl={row.avatarUrl}
            avatarPreset={row.avatarPreset}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{row.displayName}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.email}</p>
              </div>
              {canRemove ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      aria-label={t("columns.actions")}
                      className="size-8 shrink-0 rounded-md"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() =>
                        onRemove({
                          userId: row.userId,
                          name: row.displayName,
                        })
                      }
                    >
                      {t("remove")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RolePill role={row.role} label={t(`roles.${row.role}`)} />
              <StatusBadge status="active" label={t("status.active")} />
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {t("columns.joined")}: {joinedLabel}
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-border/60 px-4 py-4">
      <div className="flex items-start gap-3">
        <PendingAvatar email={row.email} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-muted-foreground">{row.email}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {t("status.pendingHint")}
              </p>
            </div>
            {isOwner ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    aria-label={t("columns.actions")}
                    className="size-8 shrink-0 rounded-md"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRevoke(row.id)}>{t("revoke")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RolePill role={row.role} label={t(`roles.${row.role}`)} />
            <StatusBadge status="pending" label={t("status.pending")} />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {t("columns.joined")}: {joinedLabel}
          </p>
        </div>
      </div>
    </article>
  );
}

export function WorkspaceSettingsUsersTab({
  workspaceId,
  members,
  invitations,
  canInviteMembers,
  isOwner,
  ownerUserId,
  locale,
}: {
  workspaceId: string;
  members: MemberRow[];
  invitations: InvitationRow[];
  canInviteMembers: boolean;
  isOwner: boolean;
  ownerUserId: string;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings.users");
  const router = useRouter();
  const { activeWorkspace, workspaces } = useWorkspaceContext();
  const billingHref =
    activeWorkspace?.isOwner && activeWorkspace.slug
      ? dashboardBillingHref(locale, activeWorkspace.slug)
      : ownedWorkspaceBillingHref(locale, workspaces);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<MemberToRemove | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = useMemo<UserTableRow[]>(() => {
    const memberRows: UserTableRow[] = members.map((member) => ({
      kind: "member",
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      displayName: member.user.name ?? member.user.email,
      email: member.user.email,
      avatarUrl: member.user.avatarUrl,
      avatarPreset: member.user.avatarPreset,
    }));

    const invitationRows: UserTableRow[] = invitations.map((invitation) => ({
      kind: "invitation",
      id: invitation.id,
      role: invitation.role,
      joinedAt: invitation.invitedAt,
      email: invitation.email,
    }));

    return sortUserRows([...memberRows, ...invitationRows]);
  }, [members, invitations]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesRole = roleFilter === "ALL" || row.role === roleFilter;
      if (!matchesRole) {
        return false;
      }

      if (!query) {
        return true;
      }

      if (row.kind === "member") {
        return (
          row.displayName.toLowerCase().includes(query) ||
          row.email.toLowerCase().includes(query)
        );
      }

      return row.email.toLowerCase().includes(query);
    });
  }, [rows, search, roleFilter]);

  function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await inviteWorkspaceMemberAction(
        workspaceId,
        { email: email.trim(), role: inviteRole },
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      const invitedEmail = email.trim();
      setEmail("");
      appToast.success(t("inviteSuccess"), {
        description: t("inviteSuccessDescription", { email: invitedEmail }),
      });
      router.refresh();
    });
  }

  function handleRevoke(invitationId: string) {
    setError(null);

    startTransition(async () => {
      const result = await revokeWorkspaceInvitationAction(
        workspaceId,
        invitationId,
        locale,
      );

      if (!result.success) {
        setError(result.error);
        appToast.error(result.error);
        return;
      }

      appToast.success(t("inviteRevoked"));
      router.refresh();
    });
  }

  return (
    <>
      <WorkspaceSettingsCard title={t("cardTitle")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 rounded-xl pl-9"
              aria-label={t("searchPlaceholder")}
            />
          </div>

          <div className="relative w-full sm:w-48">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className={cn(selectClassName, "pr-8")}
              aria-label={t("roleFilterLabel")}
            >
              <option value="ALL">{t("roleFilterAll")}</option>
              <option value="OWNER">{t("roles.OWNER")}</option>
              <option value="MEMBER">{t("roles.MEMBER")}</option>
              <option value="VIEWER">{t("roles.VIEWER")}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("emptyMembers")}</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {filteredRows.map((row) => (
                <WorkspaceUserMobileCard
                  key={`${row.kind}-${row.id}`}
                  row={row}
                  locale={locale}
                  isOwner={isOwner}
                  ownerUserId={ownerUserId}
                  isPending={isPending}
                  t={t}
                  onRemove={setMemberToRemove}
                  onRevoke={handleRevoke}
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-border/60 md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.member")}</TableHead>
                    <TableHead>{t("columns.role")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.joined")}</TableHead>
                    {isOwner ? <TableHead className="w-[52px]" /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => {
                    if (row.kind === "member") {
                      const canRemove = isOwner && row.userId !== ownerUserId;

                      return (
                        <TableRow key={`member-${row.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                imageUrl={row.avatarUrl}
                                avatarPreset={row.avatarPreset}
                                size={36}
                              />
                              <div className="min-w-0">
                                <p className="truncate font-medium">{row.displayName}</p>
                                <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RolePill role={row.role} label={t(`roles.${row.role}`)} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status="active" label={t("status.active")} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(row.joinedAt, locale, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          {isOwner ? (
                            <TableCell>
                              {canRemove ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      disabled={isPending}
                                      aria-label={t("columns.actions")}
                                    >
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() =>
                                        setMemberToRemove({
                                          userId: row.userId,
                                          name: row.displayName,
                                        })
                                      }
                                    >
                                      {t("remove")}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : null}
                            </TableCell>
                          ) : null}
                        </TableRow>
                      );
                    }

                    return (
                      <TableRow key={`invitation-${row.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <PendingAvatar email={row.email} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-muted-foreground">
                                {row.email}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {t("status.pendingHint")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RolePill role={row.role} label={t(`roles.${row.role}`)} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status="pending" label={t("status.pending")} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(row.joinedAt, locale, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        {isOwner ? (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={isPending}
                                  aria-label={t("columns.actions")}
                                >
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRevoke(row.id)}>
                                  {t("revoke")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <div className="space-y-4 border-t border-border/60 pt-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-muted/50 p-2">
              <UserPlus className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="text-base font-semibold tracking-tight">{t("inviteTitle")}</h3>
              {canInviteMembers ? (
                <p className="text-sm text-muted-foreground">{t("inviteDescription")}</p>
              ) : null}
            </div>
          </div>

          {canInviteMembers ? (
            <>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-invite-email">{t("emailLabel")}</Label>
                  <Input
                    id="workspace-invite-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t("emailPlaceholder")}
                    required
                    disabled={isPending}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workspace-invite-role">{t("roleLabel")}</Label>
                  <select
                    id="workspace-invite-role"
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value as InviteRole)}
                    disabled={isPending}
                    className={selectClassName}
                  >
                    {INVITE_ROLES.map((nextRole) => (
                      <option key={nextRole} value={nextRole}>
                        {t(`roles.${nextRole}`)}
                      </option>
                    ))}
                  </select>
                </div>

                {error ? (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" className="gap-2" disabled={isPending}>
                  <UserPlus className="size-4" aria-hidden />
                  {isPending ? t("inviting") : t("inviteSubmit")}
                </Button>
              </form>
            </>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
              <p className="text-sm text-muted-foreground">{t("inviteUpgradeDescription")}</p>
              {billingHref ? (
                <Link
                  href={billingHref}
                  className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("inviteUpgradeCta")}
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </WorkspaceSettingsCard>

      {memberToRemove ? (
        <RemoveWorkspaceMemberDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setMemberToRemove(null);
            }
          }}
          workspaceId={workspaceId}
          memberName={memberToRemove.name}
          targetUserId={memberToRemove.userId}
          locale={locale}
        />
      ) : null}
    </>
  );
}
