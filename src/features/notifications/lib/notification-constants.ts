export const NOTIFICATION_LIST_RETENTION_DAYS = 90;

export function getNotificationListSinceDate(now: Date = new Date()): Date {
  const since = new Date(now);
  since.setDate(since.getDate() - NOTIFICATION_LIST_RETENTION_DAYS);
  return since;
}
