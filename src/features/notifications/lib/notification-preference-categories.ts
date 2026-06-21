import type { NotificationPreferenceCategory } from "@prisma/client";

export const NOTIFICATION_PREFERENCE_CATEGORIES: NotificationPreferenceCategory[] = [
  "MEMBERSHIP",
  "BILLING",
  "ESTIMATES",
  "REFERRALS",
  "QA",
  "OPS",
];
