import "server-only";

import { schedules } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import { notifySubscriptionRenewalSoon } from "@/features/notifications/server/notification-emit-helpers";

const REMINDER_DAYS = [3, 7] as const;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export const notificationBillingRemindersTask = schedules.task({
  id: "notification-billing-reminders",
  cron: "0 8 * * *",
  run: async () => {
    const today = startOfUtcDay(new Date());
    let emitted = 0;

    for (const daysRemaining of REMINDER_DAYS) {
      const targetDayStart = addUtcDays(today, daysRemaining);
      const targetDayEnd = addUtcDays(targetDayStart, 1);

      const subscriptions = await prisma.subscription.findMany({
        where: {
          status: { in: ["ACTIVE", "TRIAL"] },
          cancelAtPeriodEnd: false,
          currentPeriodEnd: {
            gte: targetDayStart,
            lt: targetDayEnd,
          },
          billingAccount: {
            workspaceId: { not: null },
            workspace: { deletedAt: null },
          },
        },
        select: {
          currentPeriodEnd: true,
          billingAccount: {
            select: {
              workspace: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  defaultLocale: true,
                },
              },
            },
          },
        },
      });

      for (const row of subscriptions) {
        const workspace = row.billingAccount.workspace;
        if (!workspace || !row.currentPeriodEnd) {
          continue;
        }

        const locale = workspace.defaultLocale === "EN" ? "en" : "pl";
        const result = await notifySubscriptionRenewalSoon({
          locale,
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          workspaceName: workspace.name,
          daysRemaining,
          periodEndIso: row.currentPeriodEnd.toISOString(),
        });
        emitted += result.emitted;
      }
    }

    return { emitted };
  },
});
