"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { WorkspaceAvatar } from "@/components/avatars/workspace-avatar";
import type { WorkspaceMemberPreview } from "@/features/workspaces/server/get-active-workspace-card-data";
import { cn } from "@/lib/utils";

const SIZE_CONFIG = {
  sm: { avatar: 20, overlap: 6, overflowText: "8px", inviteIcon: 10, gap: 10 },
  md: { avatar: 25, overlap: 7, overflowText: "9px", inviteIcon: 12, gap: 12 },
} as const;

function MemberStackAvatar({
  member,
  size,
  ringClassName,
  style,
}: {
  member: WorkspaceMemberPreview;
  size: number;
  ringClassName: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 rounded-full ring-[1.5px]",
        ringClassName,
      )}
      style={{ width: size, height: size, ...style }}
      title={member.name}
    >
      {member.imageUrl ? (
        <UserAvatar
          imageUrl={member.imageUrl}
          size={size}
          className="size-full ring-0"
        />
      ) : (
        <WorkspaceAvatar
          name={member.name}
          size={size}
          className="size-full rounded-full ring-0"
        />
      )}
    </span>
  );
}

export function WorkspaceMemberStack({
  previews,
  totalCount,
  showInvite = true,
  size = "md",
  surface = "panel",
}: {
  previews: WorkspaceMemberPreview[];
  totalCount: number;
  showInvite?: boolean;
  size?: keyof typeof SIZE_CONFIG;
  surface?: "hero" | "panel";
}) {
  const t = useTranslations("sidebar.workspaceCard");
  const overflow = Math.max(0, totalCount - previews.length);
  const config = SIZE_CONFIG[size];
  const ringClassName =
    surface === "hero" ? "ring-white/90" : "ring-card";
  const onHero = surface === "hero";

  return (
    <div className="flex min-w-0 items-center">
      <div
        className="flex items-center"
        style={{ marginRight: showInvite ? config.gap : 0 }}
      >
        {previews.map((member, index) => (
          <MemberStackAvatar
            key={member.id}
            member={member}
            size={config.avatar}
            ringClassName={ringClassName}
            style={{
              zIndex: previews.length - index,
              marginLeft: index === 0 ? 0 : -config.overlap,
            }}
          />
        ))}
        {overflow > 0 ? (
          <span
            className={cn(
              "relative z-0 inline-flex shrink-0 items-center justify-center rounded-full ring-[1.5px]",
              onHero
                ? "bg-white/95 font-semibold text-slate-600 ring-white/90"
                : "bg-muted font-semibold text-muted-foreground ring-card",
            )}
            style={{
              width: config.avatar,
              height: config.avatar,
              marginLeft: previews.length > 0 ? -config.overlap : 0,
              fontSize: config.overflowText,
            }}
            title={t("membersMoreTitle", { count: overflow })}
          >
            +{overflow}
          </span>
        ) : null}
      </div>
      {showInvite ? (
        <button
          type="button"
          aria-label={t("inviteMember")}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full ring-[1.5px]",
            onHero
              ? "border border-dashed border-white/70 bg-white/95 text-slate-800 ring-white/90 hover:border-slate-400 hover:bg-white hover:text-slate-900 focus-visible:ring-white/80"
              : "border border-dashed border-border/65 bg-card text-muted-foreground ring-card hover:border-border hover:bg-accent/40 hover:text-foreground focus-visible:ring-ring/40",
            "transition-colors focus-visible:outline-none focus-visible:ring-2",
          )}
          style={{ width: config.avatar, height: config.avatar }}
        >
          <Plus style={{ width: config.inviteIcon, height: config.inviteIcon }} strokeWidth={2.25} />
        </button>
      ) : null}
    </div>
  );
}
