"use client";

import { useTranslations } from "next-intl";

export function UserSettingsNotificationsTab() {
  const tNotifications = useTranslations("navbar.notifications");
  const tBilling = useTranslations("billing");

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{tNotifications("label")}</h2>
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {tBilling("soon")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{tNotifications("empty")}</p>
      </div>
    </section>
  );
}
