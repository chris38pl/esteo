import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type { NotificationCounts } from "@/features/notifications/lib/notification-types";
import { markNotificationAsRead } from "@/features/notifications/server/get-notifications";
import { countNotificationsForUser } from "@/features/notifications/server/notification-repository";
import { syncUserFromClerk } from "@/server/auth/sync-user";

export const runtime = "nodejs";

type MarkReadResponse = {
  ok: boolean;
  counts: NotificationCounts | null;
  error?: string;
};

export async function POST(request: Request) {
  const user = await syncUserFromClerk();

  if (!user) {
    return NextResponse.json<MarkReadResponse>(
      { ok: false, counts: null, error: "unauthorized" },
      { status: 401 },
    );
  }

  let notificationId: string | undefined;

  try {
    const body = (await request.json()) as { notificationId?: string };
    notificationId = body.notificationId;
  } catch {
    return NextResponse.json<MarkReadResponse>(
      { ok: false, counts: null, error: "invalid_body" },
      { status: 400 },
    );
  }

  if (!notificationId) {
    return NextResponse.json<MarkReadResponse>(
      { ok: false, counts: null, error: "missing_notification_id" },
      { status: 400 },
    );
  }

  const updated = await markNotificationAsRead(user.id, notificationId);

  if (!updated) {
    return NextResponse.json<MarkReadResponse>(
      { ok: false, counts: null, error: "not_found_or_already_read" },
      { status: 404 },
    );
  }

  revalidatePath("/", "layout");
  const counts = await countNotificationsForUser(user.id);

  return NextResponse.json<MarkReadResponse>({ ok: true, counts });
}
