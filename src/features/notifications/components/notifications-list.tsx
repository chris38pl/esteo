"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/locale";
import {
  NotificationItem,
  type SerializedNotificationItem,
} from "@/features/notifications/components/notification-item";

export function NotificationsList({
  items,
  locale,
  isInitialLoading = false,
  emptyMessage,
  onMarkRead,
  onLoadMore,
  hasMore,
  loadingMore,
}: {
  items: SerializedNotificationItem[];
  locale: Locale;
  isInitialLoading?: boolean;
  emptyMessage: string;
  onMarkRead: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}) {
  const t = useTranslations("notifications");

  if (isInitialLoading) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[120px] items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <NotificationItem key={item.id} item={item} locale={locale} onMarkRead={onMarkRead} />
      ))}
      {hasMore && onLoadMore ? (
        <div className="border-t border-border/50 p-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {t("panel.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
