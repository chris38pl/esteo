"use client";

import { useLocale, useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { Badge } from "@/components/ui/badge";
import type { IssueActivityLogClient } from "@/features/issues/lib/serialize-issue-activity";
import type { Locale } from "@/lib/locale";

interface IssueHistoryItemProps {
  log: IssueActivityLogClient;
}

function formatTimestamp(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function actorLabel(
  log: IssueActivityLogClient,
  t: ReturnType<typeof useTranslations<"issues">>,
): string {
  if (log.actorType === "CURSOR_AI") {
    return t("admin.history.actorCursorAi");
  }

  if (log.actorType === "SYSTEM") {
    return t("admin.history.actorSystem");
  }

  return log.actor?.name?.trim() || log.actor?.email || t("admin.history.actorSystem");
}

function activityDescription(
  log: IssueActivityLogClient,
  t: ReturnType<typeof useTranslations<"issues">>,
): string {
  const meta = log.metadata;

  switch (log.action) {
    case "title_changed":
      return t("admin.history.actions.titleChanged", {
        oldTitle: meta.oldTitle ?? "",
        newTitle: meta.newTitle ?? "",
      });
    case "description_changed":
      return t("admin.history.actions.descriptionChanged");
    case "status_changed":
      return t("admin.history.actions.statusChanged", {
        oldStatus: meta.oldStatus ?? "",
        newStatus: meta.newStatus ?? "",
      });
    case "comment_added":
      return t("admin.history.actions.commentAdded");
    case "comment_edited":
      return t("admin.history.actions.commentEdited");
    case "comment_deleted":
      return meta.replyCount != null && meta.replyCount > 0
        ? t("admin.history.actions.commentDeletedWithReplies", { count: meta.replyCount })
        : t("admin.history.actions.commentDeleted");
    default:
      return log.action;
  }
}

export function IssueHistoryItem({ log }: IssueHistoryItemProps) {
  const t = useTranslations("issues");
  const locale = useLocale() as Locale;
  const description = activityDescription(log, t);
  const label = actorLabel(log, t);

  return (
    <div className="flex gap-3 py-3">
      {log.actorType === "USER" && log.actor ? (
        <UserAvatar
          imageUrl={log.actor.avatarUrl}
          avatarPreset={log.actor.avatarPreset}
          size={36}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <div
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold uppercase text-primary ring-1 ring-primary/15"
          aria-hidden
        >
          {log.actorType === "CURSOR_AI" ? "AI" : "S"}
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <time className="text-muted-foreground" dateTime={log.occurredAt}>
            {formatTimestamp(log.occurredAt, locale)}
          </time>
          <Badge variant="outline" className="text-xs">
            {t("admin.history.badge")}
          </Badge>
        </div>
        <p className="text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground"> — </span>
          <span>{description}</span>
        </p>
      </div>
    </div>
  );
}
