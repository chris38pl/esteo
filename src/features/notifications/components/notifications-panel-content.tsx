"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import { IndeterminateLoadingBar } from "@/components/ui/indeterminate-loading-bar";
import { NotificationsList } from "@/features/notifications/components/notifications-list";
import type { SerializedNotificationItem } from "@/features/notifications/components/notification-item";
import {
  fetchNotificationPanelAction,
  markNotificationReadAction,
} from "@/features/notifications/server/actions";
import type { NotificationCounts } from "@/features/notifications/lib/notification-types";

type Tab = "all" | "actionRequired";

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
  const [tab, setTab] = useState<Tab>("all");
  const [counts, setCounts] = useState(initialCounts);
  const [items, setItems] = useState<SerializedNotificationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isPanelLoading, setIsPanelLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadPanel = useCallback(
    (input: { tab: Tab; cursor?: string; append?: boolean }) => {
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

          setCounts(result.counts);
          onCountsChange?.(result.counts);
          setItems((prev) =>
            input.append ? [...prev, ...result.items] : result.items,
          );
          setCursor(result.nextCursor);
          setHasMore(Boolean(result.nextCursor));
        } finally {
          if (!input.append) {
            setIsPanelLoading(false);
          }
        }
      });
    },
    [locale, onCountsChange],
  );

  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(false);
    setIsPanelLoading(true);
    loadPanel({ tab });
  }, [tab, loadPanel]);

  const showLoadingBar = isPanelLoading;

  function handleMarkRead(notificationId: string) {
    startTransition(async () => {
      await markNotificationReadAction({ locale, notificationId });
      setItems((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setCounts((prev) => {
        const next = {
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        };
        onCountsChange?.(next);
        return next;
      });
      router.refresh();
    });
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

      {showLoadingBar ? (
        <IndeterminateLoadingBar label={t("panel.loading")} />
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <NotificationsList
          items={items}
          locale={locale}
          isInitialLoading={showLoadingBar}
          emptyMessage={
            tab === "actionRequired"
              ? t("panel.emptyActionRequired")
              : t("panel.empty")
          }
          onMarkRead={handleMarkRead}
          hasMore={hasMore}
          loadingMore={isPending}
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
