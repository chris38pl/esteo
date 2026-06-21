import "server-only";

import { schedules } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import { notifySubscriptionPastDue } from "@/features/notifications/server/notification-emit-helpers";
import { workspaceLocaleToAppLocale } from "@/lib/workspace-locale";

export const notificationOverduePaymentsTask = schedules.task({
  id: "notification-overdue-payments",
  cron: "0 9 * * *",
  run: async () => {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: "PAST_DUE",
        billingAccount: {
          workspaceId: { not: null },
          workspace: { deletedAt: null },
        },
      },
      select: {
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

    let emitted = 0;

    for (const row of subscriptions) {
      const workspace = row.billingAccount.workspace;
      if (!workspace) {
        continue;
      }

      const result = await notifySubscriptionPastDue({
        locale: workspaceLocaleToAppLocale(workspace.defaultLocale),
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
        workspaceName: workspace.name,
      });
      emitted += result.emitted;
    }

    return { emitted, checked: subscriptions.length };
  },
});
