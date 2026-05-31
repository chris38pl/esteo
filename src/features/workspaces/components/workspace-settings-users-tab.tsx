"use client";

import type { InviteRole, WorkspaceInvitation, WorkspaceRule, WorkspaceRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { WorkspaceAvatar } from "@/components/avatars/workspace-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { INVITE_ROLES } from "@/features/workspaces/lib/invite-role";
import {
  inviteWorkspaceMemberAction,
  revokeWorkspaceInvitationAction,
} from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type MemberRow = {
  id: string;
  role: WorkspaceRole;
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

const selectClassName = cn(
  "h-11 w-full appearance-none rounded-xl border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

export function WorkspaceSettingsUsersTab({
  workspaceId,
  members,
  invitations,
  locale,
}: {
  workspaceId: string;
  members: MemberRow[];
  invitations: WorkspaceInvitation[];
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings.users");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(event: React.FormEvent<HTMLFormElement>) {
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
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{t("membersTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("membersDescription")}</p>

        <div className="mt-4 rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.member")}</TableHead>
                <TableHead>{t("columns.role")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-muted-foreground">
                    {t("emptyMembers")}
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {member.user.avatarUrl ? (
                          <UserAvatar
                            imageUrl={member.user.avatarUrl}
                            size={32}
                          />
                        ) : (
                          <WorkspaceAvatar
                            name={member.user.name ?? member.user.email}
                            size={32}
                            className="rounded-full"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {member.user.name ?? member.user.email}
                          </p>
                          {member.user.name ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {member.user.email}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(`roles.${member.role}`)}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {invitations.length > 0 ? (
        <div>
          <h2 className="text-base font-semibold tracking-tight">{t("pendingTitle")}</h2>
          <div className="mt-4 rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.email")}</TableHead>
                  <TableHead>{t("columns.role")}</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t(`roles.${invitation.role}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRevoke(invitation.id)}
                      >
                        {t("revoke")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="text-base font-semibold tracking-tight">{t("inviteTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("inviteDescription")}</p>

        <form onSubmit={handleInvite} className="mt-4 space-y-4">
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
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="rounded-lg" disabled={isPending}>
            {isPending ? t("inviting") : t("inviteSubmit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
