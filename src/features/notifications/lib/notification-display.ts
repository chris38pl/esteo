import type { NotificationType } from "@prisma/client";

import type { NotificationListItem } from "@/features/notifications/lib/notification-types";

export function getNotificationTranslationValues(
  item: Pick<NotificationListItem, "type" | "payload" | "workspaceName">,
): Record<string, string | number> {
  const payload = (item.payload ?? {}) as Record<string, unknown>;
  const values: Record<string, string | number> = {};

  if (typeof payload.requestTitle === "string") {
    values.requestTitle = payload.requestTitle;
  }
  if (typeof payload.workspaceName === "string") {
    values.workspaceName = payload.workspaceName;
  } else if (item.workspaceName) {
    values.workspaceName = item.workspaceName;
  }
  if (typeof payload.issueTitle === "string") {
    values.issueTitle = payload.issueTitle;
  }
  if (typeof payload.issueNumber === "number") {
    values.issueNumber = payload.issueNumber;
  }
  if (typeof payload.oldStatus === "string") {
    values.oldStatus = payload.oldStatus;
  }
  if (typeof payload.newStatus === "string") {
    values.newStatus = payload.newStatus;
  }
  if (typeof payload.daysRemaining === "number") {
    values.daysRemaining = payload.daysRemaining;
  }
  if (typeof payload.used === "number") {
    values.used = payload.used;
  }
  if (typeof payload.limit === "number") {
    values.limit = payload.limit;
  }

  return values;
}

export function getNotificationTypeKey(type: NotificationType): string {
  return `types.${type}`;
}
