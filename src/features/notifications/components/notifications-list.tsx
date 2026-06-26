"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/locale";
import {
  NotificationItem,
  type SerializedNotificationItem,
} from "@/features/notifications/components/notification-item";
import { NotificationsPanelSkeleton } from "@/features/notifications/components/notifications-panel-skeleton";

const LOAD_MORE_ROOT_MARGIN = "120px";

export function NotificationsList({
  items,
  locale,
  isInitialLoading = false,
  emptyMessage,
  onMarkRead,
  onActionComplete,
  onLoadMore,
  hasMore,
  loadingMore,
  scrollRef,
  enableSwipe = false,
}: {
  items: SerializedNotificationItem[];
  locale: Locale;
  isInitialLoading?: boolean;
  emptyMessage: string;
  onMarkRead: (id: string) => void;
  onActionComplete?: (notificationId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  scrollRef?: RefObject<HTMLDivElement | null>;
  enableSwipe?: boolean;
}) {
  const t = useTranslations("notifications");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const loadingMoreRef = useRef(loadingMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || !onLoadMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loadingMoreRef.current) {
          onLoadMoreRef.current?.();
        }
      },
      {
        root: scrollRef?.current ?? null,
        rootMargin: LOAD_MORE_ROOT_MARGIN,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, scrollRef, items.length]);

  if (isInitialLoading) {
    return <NotificationsPanelSkeleton />;
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
        <NotificationItem
          key={item.id}
          item={item}
          locale={locale}
          onMarkRead={onMarkRead}
          onActionComplete={onActionComplete}
          enableSwipe={enableSwipe}
        />
      ))}
      {hasMore ? <div ref={sentinelRef} className="h-px" aria-hidden /> : null}
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
