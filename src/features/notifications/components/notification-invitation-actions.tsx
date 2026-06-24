"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { appToast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import { parseNotificationInvitationPayload } from "@/features/notifications/lib/notification-invitation-payload";
import type { NotificationListItem } from "@/features/notifications/lib/notification-types";
import {
  acceptReceivedInvitationAction,
  declineReceivedInvitationAction,
} from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";

function resolveNotificationActionLabelKey(labelKey: string): string {
  return labelKey.startsWith("notifications.")
    ? labelKey.slice("notifications.".length)
    : labelKey;
}

type SerializedNotificationItem = Omit<
  NotificationListItem,
  "createdAt" | "readAt" | "resolvedAt"
> & {
  createdAt: string;
  readAt: string | null;
  resolvedAt: string | null;
};

export function NotificationInvitationActions({
  item,
  locale,
  onActionComplete,
}: {
  item: SerializedNotificationItem;
  locale: Locale;
  onActionComplete?: (notificationId: string) => void;
}) {
  const t = useTranslations("notifications");
  const tInvites = useTranslations("workspaces.invitations");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"accept" | "decline" | null>(null);

  const invitationPayload = parseNotificationInvitationPayload(item.payload);

  if (
    item.type !== "invitation_received" ||
    !invitationPayload ||
    item.resolvedAt !== null ||
    item.state !== "ACTION_REQUIRED"
  ) {
    return null;
  }

  const invitationId = invitationPayload.invitationId;

  function handleError(result: { success: false; error: string; code?: string }) {
    if (result.code === "WORKSPACE_SEAT_LIMIT") {
      appToast.error(tInvites("errors.WORKSPACE_SEAT_LIMIT"));
      return;
    }

    appToast.error(result.error);
  }

  function runAction(
    action: () => Promise<
      | { success: true; data: unknown }
      | { success: false; error: string; code?: string }
    >,
    actionKind: "accept" | "decline",
  ) {
    setPendingAction(actionKind);
    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        handleError(result);
        setPendingAction(null);
        return;
      }

      onActionComplete?.(item.id);
      router.refresh();
      setPendingAction(null);

      if (!("closed" in (result.data as object))) {
        appToast.success(
          actionKind === "accept"
            ? tInvites("actionAccepted")
            : tInvites("actionDeclined"),
        );
      }
    });
  }

  function handleAccept() {
    runAction(() => acceptReceivedInvitationAction(invitationId, locale), "accept");
  }

  function handleDecline() {
    runAction(() => declineReceivedInvitationAction(invitationId, locale), "decline");
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2 pl-4">
      {item.primaryActionLabelKey ? (
        <Button
          type="button"
          size="sm"
          variant="default"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={handleAccept}
        >
          {pendingAction === "accept"
            ? tInvites("accepting")
            : t(
                resolveNotificationActionLabelKey(item.primaryActionLabelKey) as "actions.acceptInvite",
              )}
        </Button>
      ) : null}
      {item.secondaryActionLabelKey ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={handleDecline}
        >
          {pendingAction === "decline"
            ? tInvites("declining")
            : t(
                resolveNotificationActionLabelKey(
                  item.secondaryActionLabelKey,
                ) as "actions.declineInvite",
              )}
        </Button>
      ) : null}
    </div>
  );
}
