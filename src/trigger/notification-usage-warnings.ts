import "server-only";

import { schedules } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import {
  notifyEstimateLimitNear,
  notifyEstimateLimitReached,
} from "@/features/notifications/server/notification-emit-helpers";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";
import { workspaceLocaleToAppLocale } from "@/lib/workspace-locale";

export const notificationUsageWarningsTask = schedules.task({
  id: "notification-usage-warnings",
  cron: "0 10 * * *",
  run: async () => {
    const workspaces = await prisma.workspace.findMany({
      where: {
        deletedAt: null,
        billingAccount: {
          subscription: {
            plan: { in: ["FREE", "PRO"] },
            status: { in: ["ACTIVE", "TRIAL"] },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        defaultLocale: true,
      },
    });

    let nearEmitted = 0;
    let reachedEmitted = 0;

    for (const workspace of workspaces) {
      const entitlements = await getWorkspaceEntitlements(workspace.id);
      const limit = entitlements.limits.maxEstimatesPerMonth;
      if (limit === null) {
        continue;
      }

      const used = entitlements.usage.estimatesThisMonth;
      const ctx = {
        locale: workspaceLocaleToAppLocale(workspace.defaultLocale),
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
        workspaceName: workspace.name,
        used,
        limit,
      };

      if (used >= limit) {
        const result = await notifyEstimateLimitReached(ctx);
        reachedEmitted += result.emitted;
        continue;
      }

      if (used / limit >= 0.8) {
        const result = await notifyEstimateLimitNear(ctx);
        nearEmitted += result.emitted;
      }
    }

    return {
      checked: workspaces.length,
      nearEmitted,
      reachedEmitted,
    };
  },
});
