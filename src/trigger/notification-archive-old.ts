import "server-only";

import { task } from "@trigger.dev/sdk";

import { archiveOldNotifications } from "@/features/notifications/server/notification-repository";

export const notificationArchiveOldTask = task({
  id: "notification-archive-old",
  run: async () => {
    const archived = await archiveOldNotifications();
    return { archived };
  },
});
