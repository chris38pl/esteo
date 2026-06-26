import type { NotificationCounts } from "@/features/notifications/lib/notification-types";

export async function persistNotificationMarkRead(
  notificationId: string,
): Promise<{ ok: boolean; counts: NotificationCounts | null }> {
  const response = await fetch("/api/notifications/mark-read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notificationId }),
  });

  let payload: { ok: boolean; counts: NotificationCounts | null } = {
    ok: false,
    counts: null,
  };

  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    return { ok: false, counts: null };
  }

  if (!response.ok) {
    return { ok: false, counts: null };
  }

  return payload;
}
