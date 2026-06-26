"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import { NotificationsList } from "@/features/notifications/components/notifications-list";
import type { SerializedNotificationItem } from "@/features/notifications/components/notification-item";
import { fetchNotificationPanelAction } from "@/features/notifications/server/actions";
import { persistNotificationMarkRead } from "@/features/notifications/lib/persist-notification-mark-read";
import type { NotificationCounts } from "@/features/notifications/lib/notification-types";

type Tab = "all" | "actionRequired";

function useMdUp() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(min-width: 768px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => true,
  );
}

function decrementUnreadCount(counts: NotificationCounts): NotificationCounts {
  return {
    ...counts,
    unread: Math.max(0, counts.unread - 1),
  };
}

function mergeItemsPreservingReads(
  serverItems: SerializedNotificationItem[],
  localItems: SerializedNotificationItem[],
  pendingReadIds: ReadonlySet<string>,
): SerializedNotificationItem[] {
  const localById = new Map(localItems.map((item) => [item.id, item]));

  return serverItems.map((item) => {
    const local = localById.get(item.id);
    if (!local?.readAt) {
      return item;
    }

    if (pendingReadIds.has(item.id) || item.readAt === null) {
      return { ...item, readAt: local.readAt };
    }

    return item;
  });
}

export function NotificationsPanelContent({
  locale,
  initialCounts,
  onCountsChange,
}: {
  locale: Locale;
  initialCounts: NotificationCounts;
  onCountsChange?: (counts: NotificationCounts) => void;
}) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const mdUp = useMdUp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const countsRef = useRef(initialCounts);
  const itemsRef = useRef<SerializedNotificationItem[]>([]);
  const pendingReadIdsRef = useRef(new Set<string>());
  const loadGenerationRef = useRef(0);
  const [tab, setTab] = useState<Tab>("all");
  const [counts, setCounts] = useState(initialCounts);
  const [items, setItems] = useState<SerializedNotificationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isPanelLoading, setIsPanelLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const syncCounts = useCallback(
    (next: NotificationCounts) => {
      countsRef.current = next;
      setCounts(next);
      onCountsChange?.(next);
    },
    [onCountsChange],
  );

  useEffect(() => {
    countsRef.current = initialCounts;
    setCounts(initialCounts);
  }, [initialCounts]);

  const loadPanel = useCallback(
    (input: { tab: Tab; cursor?: string; append?: boolean }) => {
      const generation = ++loadGenerationRef.current;

      if (!input.append) {
        setIsPanelLoading(true);
      }

      startTransition(async () => {
        try {
          const result = await fetchNotificationPanelAction({
            locale,
            actionRequiredOnly: input.tab === "actionRequired",
            cursor: input.cursor,
          });

          if (generation !== loadGenerationRef.current) {
            return;
          }

          setItems((prev) => {
            const nextItems = input.append
              ? [...prev, ...result.items]
              : mergeItemsPreservingReads(
                  result.items,
                  prev,
                  pendingReadIdsRef.current,
                );

            itemsRef.current = nextItems;
            return nextItems;
          });

          if (!input.append) {
            const hasPendingReads = pendingReadIdsRef.current.size > 0;
            if (!hasPendingReads) {
              syncCounts(result.counts);
            }
          }

          setCursor(result.nextCursor);
          setHasMore(Boolean(result.nextCursor));
        } finally {
          if (!input.append && generation === loadGenerationRef.current) {
            setIsPanelLoading(false);
          }
        }
      });
    },
    [locale, syncCounts],
  );

  useEffect(() => {
    setItems([]);
    itemsRef.current = [];
    setCursor(null);
    setHasMore(false);
    setIsPanelLoading(true);
    loadPanel({ tab });
  }, [tab, loadPanel]);

  function rollbackMarkRead(notificationId: string) {
    pendingReadIdsRef.current.delete(notificationId);

    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === notificationId ? { ...item, readAt: null } : item,
      );
      itemsRef.current = next;
      return next;
    });

    syncCounts({
      ...countsRef.current,
      unread: countsRef.current.unread + 1,
    });
  }

  function handleMarkRead(notificationId: string) {
    const target = itemsRef.current.find((item) => item.id === notificationId);
    if (!target || target.readAt !== null) {
      return;
    }

    pendingReadIdsRef.current.add(notificationId);
    const readAt = new Date().toISOString();

    setItems((prev) => {
      const next = prev.map((item) =>
        item.id === notificationId ? { ...item, readAt } : item,
      );
      itemsRef.current = next;
      return next;
    });

    syncCounts(decrementUnreadCount(countsRef.current));

    startTransition(async () => {
      try {
        const result = await persistNotificationMarkRead(notificationId);

        if (!result.ok) {
          rollbackMarkRead(notificationId);
          return;
        }

        pendingReadIdsRef.current.delete(notificationId);

        if (result.counts) {
          syncCounts(result.counts);
        }

        router.refresh();
      } catch {
        rollbackMarkRead(notificationId);
      }
    });
  }

  function handleActionComplete(notificationId: string) {
    setItems((prev) => prev.filter((item) => item.id !== notificationId));
    syncCounts({
      ...countsRef.current,
      unread: Math.max(0, countsRef.current.unread - 1),
      actionRequired: Math.max(0, countsRef.current.actionRequired - 1),
    });
    loadPanel({ tab });
    router.refresh();
  }

  return (
    <div className="flex max-h-[min(70vh,520px)] flex-col">
      <div className="border-b border-border/60 px-4 py-3">
        <h2 className="text-sm font-semibold">{t("panel.title")}</h2>
      </div>

      <div className="flex border-b border-border/60">
        <button
          type="button"
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium transition-colors",
            tab === "all"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setTab("all")}
        >
          {t("panel.tabAll", { count: counts.total })}
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 px-3 py-2 text-xs font-medium transition-colors",
            tab === "actionRequired"
              ? "border-b-2 border-destructive text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setTab("actionRequired")}
        >
          {t("panel.tabActionRequired", { count: counts.actionRequired })}
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <NotificationsList
          items={items}
          locale={locale}
          isInitialLoading={isPanelLoading}
          emptyMessage={
            tab === "actionRequired"
              ? t("panel.emptyActionRequired")
              : t("panel.empty")
          }
          onMarkRead={handleMarkRead}
          onActionComplete={handleActionComplete}
          hasMore={hasMore}
          loadingMore={isPending && !isPanelLoading}
          scrollRef={scrollRef}
          enableSwipe={!mdUp}
          onLoadMore={() => {
            if (cursor) {
              loadPanel({ tab, cursor, append: true });
            }
          }}
        />
      </div>
    </div>
  );
}
