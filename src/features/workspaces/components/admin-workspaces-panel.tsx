"use client";

import { WorkspaceIndustry } from "@prisma/client";
import { FileStack, GitBranch, MoreHorizontal, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";

import { WorkspaceMemberStack } from "@/components/layout/app-sidebar/workspace-member-stack";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemedWorkspaceIcon } from "@/features/workspaces/components/themed-workspace-icon";
import type { AdminWorkspaceRow } from "@/features/workspaces/server/admin-workspaces";
import {
  adminArchiveWorkspaceAction,
  adminInviteToWorkspaceAction,
  adminUpdateWorkspaceAction,
} from "@/features/workspaces/server/admin-actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type DialogMode = "rename" | "delete" | "invite" | null;

function formatRelativeAgo(locale: string, value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const absSec = Math.abs(diffSec);

  if (absSec < 60) {
    return rtf.format(diffSec, "second");
  }

  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }

  const diffHour = Math.round(diffSec / 3600);
  if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, "hour");
  }

  const diffDay = Math.round(diffSec / 86400);
  if (Math.abs(diffDay) < 30) {
    return rtf.format(diffDay, "day");
  }

  const diffMonth = Math.round(diffSec / (86400 * 30));
  if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, "month");
  }

  const diffYear = Math.round(diffSec / (86400 * 365));
  return rtf.format(diffYear, "year");
}

function StatColumn({
  icon: Icon,
  label,
  count,
  className,
}: {
  icon: LucideIcon;
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <div className={cn("min-w-[108px]", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <Icon className="size-4 shrink-0 text-muted-foreground/80" strokeWidth={1.75} />
        <span className="text-base font-semibold tabular-nums leading-none">{count}</span>
      </div>
    </div>
  );
}

function IndustryColumn({
  label,
  industryLabel,
  className,
}: {
  label: string;
  industryLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-[108px]", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5">
        <Badge
          variant="secondary"
          className="max-w-[140px] truncate rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300"
          title={industryLabel}
        >
          {industryLabel}
        </Badge>
      </div>
    </div>
  );
}

function AdminWorkspaceListRow({
  workspace,
  onOpenDialog,
}: {
  workspace: AdminWorkspaceRow;
  onOpenDialog: (mode: DialogMode, workspace: AdminWorkspaceRow) => void;
}) {
  const t = useTranslations("admin.workspaces");
  const tIndustries = useTranslations("workspaces.industries");
  const locale = useLocale();
  const ownerLabel = workspace.owner.name ?? workspace.owner.email;
  const createdAgo = formatRelativeAgo(locale, workspace.createdAt);
  const updatedAgo = formatRelativeAgo(locale, workspace.updatedAt);
  const industryLabel =
    workspace.industry === WorkspaceIndustry.OTHER && workspace.industryOtherText
      ? workspace.industryOtherText
      : tIndustries(workspace.industry);

  return (
    <div className="flex items-center gap-4 px-4 py-4 sm:gap-6">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <ThemedWorkspaceIcon name={workspace.name} theme={workspace.appearanceTheme} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{workspace.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {t("row.meta", {
              owner: ownerLabel,
              created: createdAgo,
              updated: updatedAgo,
            })}
          </p>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-8 md:flex">
        <IndustryColumn label={t("stats.industry")} industryLabel={industryLabel} />
        <StatColumn
          icon={FileStack}
          label={t("stats.estimateRequests")}
          count={workspace.estimateRequestCount}
        />
        <StatColumn
          icon={GitBranch}
          label={t("stats.estimates")}
          count={workspace.estimateCount}
        />
      </div>

      <div className="hidden shrink-0 flex-col gap-1.5 sm:flex sm:min-w-[148px]">
        <p className="text-xs text-muted-foreground">
          {t("row.membersHeading", { count: workspace.memberCount })}
        </p>
        <WorkspaceMemberStack
          previews={workspace.memberPreviews}
          totalCount={workspace.memberCount}
          size="sm"
          surface="panel"
          onInviteClick={() => onOpenDialog("invite", workspace)}
        />
      </div>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-lg text-muted-foreground"
            aria-label={t("actions.menu")}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => onOpenDialog("rename", workspace)}>
            {t("actions.rename")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onOpenDialog("invite", workspace)}>
            {t("actions.invite")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onOpenDialog("delete", workspace)}
          >
            {t("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function AdminWorkspacesPanel({
  locale,
  initialWorkspaces,
}: {
  locale: Locale;
  initialWorkspaces: AdminWorkspaceRow[];
}) {
  const t = useTranslations("admin.workspaces");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [activeWorkspace, setActiveWorkspace] = useState<AdminWorkspaceRow | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return workspaces;
    }

    return workspaces.filter((workspace) => {
      const haystack = [
        workspace.name,
        workspace.slug,
        workspace.owner.email,
        workspace.owner.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [search, workspaces]);

  function openDialog(mode: DialogMode, workspace: AdminWorkspaceRow) {
    setActiveWorkspace(workspace);
    setDialogMode(mode);
    setError(null);
    setName(workspace.name);
    setSlug(workspace.slug);
    setEmail("");
  }

  function closeDialog() {
    setDialogMode(null);
    setActiveWorkspace(null);
    setError(null);
  }

  function handleRename() {
    if (!activeWorkspace) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await adminUpdateWorkspaceAction(
        activeWorkspace.id,
        { name, slug },
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setWorkspaces((current) =>
        current.map((row) =>
          row.id === activeWorkspace.id ? { ...row, name: name.trim(), slug } : row,
        ),
      );
      closeDialog();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!activeWorkspace) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await adminArchiveWorkspaceAction(activeWorkspace.id, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setWorkspaces((current) => current.filter((row) => row.id !== activeWorkspace.id));
      closeDialog();
      router.refresh();
    });
  }

  function handleInvite() {
    if (!activeWorkspace) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await adminInviteToWorkspaceAction(activeWorkspace.id, email, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      closeDialog();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 rounded-xl pl-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">{t("bar.allWorkspaces")}</span>
          <Button asChild size="sm" className="rounded-lg px-4">
            <Link href={`/${locale}/dashboard/workspaces/new`}>{t("bar.addWorkspace")}</Link>
          </Button>
        </div>

        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((workspace) => (
              <AdminWorkspaceListRow
                key={workspace.id}
                workspace={workspace}
                onOpenDialog={openDialog}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogMode === "rename"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("rename.title")}</DialogTitle>
            <DialogDescription>{t("rename.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-workspace-name">{t("rename.nameLabel")}</Label>
              <Input
                id="admin-workspace-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-workspace-slug">{t("rename.slugLabel")}</Label>
              <Input
                id="admin-workspace-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                disabled={isPending}
                className="font-mono text-sm"
              />
            </div>
            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" disabled={isPending} onClick={closeDialog}>
              {t("actions.cancel")}
            </Button>
            <Button type="button" disabled={isPending} onClick={handleRename}>
              {isPending ? t("actions.saving") : t("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "delete"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("delete.title", { name: activeWorkspace?.name ?? "" })}</DialogTitle>
            <DialogDescription>{t("delete.description")}</DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" disabled={isPending} onClick={closeDialog}>
              {t("actions.cancel")}
            </Button>
            <Button type="button" variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending ? t("actions.deleting") : t("actions.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "invite"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("invite.title", { name: activeWorkspace?.name ?? "" })}</DialogTitle>
            <DialogDescription>{t("invite.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-workspace-invite-email">{t("invite.emailLabel")}</Label>
            <Input
              id="admin-workspace-invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("invite.emailPlaceholder")}
              disabled={isPending}
            />
            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" disabled={isPending} onClick={closeDialog}>
              {t("actions.cancel")}
            </Button>
            <Button type="button" disabled={isPending} onClick={handleInvite}>
              {isPending ? t("actions.inviting") : t("actions.inviteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
