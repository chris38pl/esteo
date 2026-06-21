"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { NotificationPreferenceCategory } from "@prisma/client";

import { Switch } from "@/components/ui/switch";
import {
  fetchNotificationPreferencesAction,
  updateNotificationPreferenceAction,
} from "@/features/notifications/server/actions";
import { NOTIFICATION_PREFERENCE_CATEGORIES } from "@/features/notifications/lib/notification-preference-categories";
import type { Locale } from "@/lib/locale";

export function UserSettingsNotificationsTab({ locale }: { locale: Locale }) {
  const t = useTranslations("notifications.preferences");
  const tBilling = useTranslations("billing");
  const [preferences, setPreferences] = useState<Record<
    NotificationPreferenceCategory,
    boolean
  > | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const prefs = await fetchNotificationPreferencesAction(locale);
      setPreferences(prefs);
    });
  }, [locale]);

  function handleToggle(category: NotificationPreferenceCategory, enabled: boolean) {
    setPreferences((prev) => (prev ? { ...prev, [category]: enabled } : prev));
    startTransition(async () => {
      await updateNotificationPreferenceAction({ locale, category, enabled });
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        <ul className="mt-6 divide-y divide-border/60">
          {NOTIFICATION_PREFERENCE_CATEGORIES.map((category) => {
            const enabled = preferences?.[category] ?? true;
            return (
              <li
                key={category}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">{t(`categories.${category}`)}</p>
                </div>
                <Switch
                  checked={enabled}
                  disabled={preferences === null || isPending}
                  onCheckedChange={(checked) => handleToggle(category, checked)}
                  aria-label={t(`categories.${category}`)}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{t("emailSoon")}</h3>
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {tBilling("soon")}
          </span>
        </div>
      </section>
    </div>
  );
}
