"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import type { NotificationType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import {
  getNotificationTranslationValues,
  getNotificationTypeKey,
} from "@/features/notifications/lib/notification-display";
import { NotificationInvitationActions } from "@/features/notifications/components/notification-invitation-actions";
import type { NotificationListItem } from "@/features/notifications/lib/notification-types";

const READ_OPACITY = 0.55;
const ITEM_EASE = [0.22, 1, 0.36, 1] as const;
const SWIPE_MAX = 96;
const SWIPE_COMMIT = 72;

function itemTransition(reduced: boolean, duration = 0.22) {
  return reduced ? { duration: 0 } : { duration, ease: ITEM_EASE };
}

function resolveNotificationActionLabelKey(labelKey: string): string {
  return labelKey.startsWith("notifications.")
    ? labelKey.slice("notifications.".length)
    : labelKey;
}

type SerializedNotificationItem = Omit<
  NotificationListItem,
  "createdAt" | "readAt" | "resolvedAt"
> & {
  createdAt: string;
  readAt: string | null;
  resolvedAt: string | null;
};

function NotificationSwipeRow({
  enabled,
  onMarkRead,
  prefersReducedMotion,
  children,
}: {
  enabled: boolean;
  onMarkRead: () => void;
  prefersReducedMotion: boolean;
  children: ReactNode;
}) {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 flex items-center bg-primary px-5"
        style={{ width: SWIPE_MAX }}
        aria-hidden
      >
        <Check className="size-5 text-primary-foreground" strokeWidth={2.25} />
      </div>
      <motion.div
        drag={prefersReducedMotion ? false : "x"}
        dragConstraints={{ left: 0, right: SWIPE_MAX }}
        dragElastic={0.08}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (info.offset.x >= SWIPE_COMMIT) {
            onMarkRead();
          }
        }}
        className="relative touch-pan-y bg-background"
      >
        {children}
      </motion.div>
    </div>
  );
}

export function NotificationItem({
  item,
  locale,
  onMarkRead,
  onActionComplete,
  enableSwipe = false,
}: {
  item: SerializedNotificationItem;
  locale: Locale;
  onMarkRead: (id: string) => void;
  onActionComplete?: (notificationId: string) => void;
  enableSwipe?: boolean;
}) {
  const t = useTranslations("notifications");
  const prefersReducedMotion = useReducedMotion() ?? false;
  const values = getNotificationTranslationValues(item);
  const body = t(getNotificationTypeKey(item.type) as `types.${NotificationType}`, values);
  const isUnread = item.readAt === null;
  const isInvitationNotification = item.type === "invitation_received";
  const isActionRequired = item.state === "ACTION_REQUIRED" && item.resolvedAt === null;
  const useInvitationActions = isInvitationNotification && isActionRequired;
  const showActionRequiredBg = isActionRequired && isUnread;
  const swipeEnabled = enableSwipe && isUnread;

  function handleNavigate() {
    onMarkRead(item.id);
  }

  function handleMarkRead() {
    onMarkRead(item.id);
  }

  const hasLinkActions =
    !isInvitationNotification &&
    ((item.primaryActionLabelKey && item.primaryActionHref) ||
      (item.secondaryActionLabelKey && item.secondaryActionHref));

  const rowContent = (
    <>
      <div className="flex items-start gap-1">
        <Link
          href={item.href}
          onClick={handleNavigate}
          className="group min-w-0 flex-1 space-y-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start gap-2">
            <motion.span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                isUnread ? "bg-primary" : "bg-transparent",
              )}
              animate={
                isUnread
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0, opacity: 0 }
              }
              transition={itemTransition(prefersReducedMotion)}
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p
                className={cn(
                  "text-sm leading-snug",
                  isUnread
                    ? "text-foreground group-hover:underline"
                    : "text-muted-foreground",
                )}
              >
                {body}
              </p>
              {item.workspaceName ? (
                <p
                  className={cn(
                    "text-xs",
                    isUnread ? "text-muted-foreground" : "text-muted-foreground/70",
                  )}
                >
                  {item.workspaceName}
                </p>
              ) : null}
              <p
                className={cn(
                  "text-xs",
                  isUnread ? "text-muted-foreground" : "text-muted-foreground/70",
                )}
              >
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                  locale: locale === "pl" ? pl : enUS,
                })}
              </p>
            </div>
          </div>
        </Link>

        <AnimatePresence initial={false}>
          {isUnread ? (
            <motion.button
              key="mark-read"
              type="button"
              initial={false}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.75 }
              }
              transition={itemTransition(prefersReducedMotion)}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.88 }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleMarkRead();
              }}
              className="inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              aria-label={t("actions.markAsRead")}
            >
              <Check className="size-4" aria-hidden />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {useInvitationActions ? (
        <NotificationInvitationActions
          item={item}
          locale={locale}
          onActionComplete={onActionComplete}
        />
      ) : null}

      {hasLinkActions ? (
        <div className="mt-2 flex flex-wrap gap-2 pl-4">
          {item.primaryActionLabelKey && item.primaryActionHref ? (
            <Button asChild size="sm" variant="default" className="h-7 text-xs">
              <Link href={item.primaryActionHref} onClick={() => handleMarkRead()}>
                {t(
                  resolveNotificationActionLabelKey(
                    item.primaryActionLabelKey,
                  ) as "actions.acceptInvite",
                )}
              </Link>
            </Button>
          ) : null}
          {item.secondaryActionLabelKey && item.secondaryActionHref ? (
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link href={item.secondaryActionHref} onClick={() => handleMarkRead()}>
                {t(
                  resolveNotificationActionLabelKey(
                    item.secondaryActionLabelKey,
                  ) as "actions.declineInvite",
                )}
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );

  return (
    <motion.div
      animate={{ opacity: isUnread ? 1 : READ_OPACITY }}
      transition={itemTransition(prefersReducedMotion, 0.28)}
      className={cn(
        "border-b border-border/50 last:border-b-0",
        showActionRequiredBg && "bg-destructive/5",
      )}
    >
      <NotificationSwipeRow
        enabled={swipeEnabled}
        onMarkRead={handleMarkRead}
        prefersReducedMotion={prefersReducedMotion}
      >
        <div className="px-4 py-3">{rowContent}</div>
      </NotificationSwipeRow>
    </motion.div>
  );
}

export type { SerializedNotificationItem };
