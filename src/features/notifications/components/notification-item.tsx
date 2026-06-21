"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import {
  getNotificationTranslationValues,
  getNotificationTypeKey,
} from "@/features/notifications/lib/notification-display";
import type { NotificationListItem } from "@/features/notifications/lib/notification-types";

type SerializedNotificationItem = Omit<
  NotificationListItem,
  "createdAt" | "readAt" | "resolvedAt"
> & {
  createdAt: string;
  readAt: string | null;
  resolvedAt: string | null;
};

export function NotificationItem({
  item,
  locale,
  onMarkRead,
}: {
  item: SerializedNotificationItem;
  locale: Locale;
  onMarkRead: (id: string) => void;
}) {
  const t = useTranslations("notifications");
  const values = getNotificationTranslationValues(item);
  const body = t(getNotificationTypeKey(item.type), values);
  const isUnread = item.readAt === null;
  const isActionRequired = item.state === "ACTION_REQUIRED" && item.resolvedAt === null;

  function handleNavigate() {
    onMarkRead(item.id);
  }

  return (
    <div
      className={cn(
        "border-b border-border/50 px-4 py-3 last:border-b-0",
        isActionRequired && "bg-destructive/5",
      )}
    >
      <Link
        href={item.href}
        onClick={handleNavigate}
        className="group block space-y-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full",
              isUnread ? "bg-primary" : "bg-transparent",
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm leading-snug text-foreground group-hover:underline">{body}</p>
            {item.workspaceName ? (
              <p className="text-xs text-muted-foreground">{item.workspaceName}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), {
                addSuffix: true,
                locale: locale === "pl" ? pl : enUS,
              })}
            </p>
          </div>
        </div>
      </Link>

      {(item.primaryActionLabelKey && item.primaryActionHref) ||
      (item.secondaryActionLabelKey && item.secondaryActionHref) ? (
        <div className="mt-2 flex flex-wrap gap-2 pl-4">
          {item.primaryActionLabelKey && item.primaryActionHref ? (
            <Button asChild size="sm" variant="default" className="h-7 text-xs">
              <Link
                href={item.primaryActionHref}
                onClick={() => onMarkRead(item.id)}
              >
                {t(item.primaryActionLabelKey as "actions.acceptInvite")}
              </Link>
            </Button>
          ) : null}
          {item.secondaryActionLabelKey && item.secondaryActionHref ? (
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link
                href={item.secondaryActionHref}
                onClick={() => onMarkRead(item.id)}
              >
                {t(item.secondaryActionLabelKey as "actions.declineInvite")}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type { SerializedNotificationItem };
