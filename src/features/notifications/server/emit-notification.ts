import "server-only";

import type { NotificationType } from "@prisma/client";

import {
  NOTIFICATION_TYPE_CATALOG,
  type CatalogNotificationType,
  type NotificationTypeDefinition,
} from "@/features/notifications/lib/notification-type-catalog";
import { resolveRecipients } from "@/features/notifications/lib/notification-recipients";
import type { EmitContext } from "@/features/notifications/lib/notification-types";
import { isNotificationCategoryEnabled } from "@/features/notifications/server/notification-preferences";
import { createNotificationRecord } from "@/features/notifications/server/notification-repository";

export type EmitUserNotificationInput = {
  type: CatalogNotificationType;
  context: EmitContext;
  recipientUserIds?: string[];
};

export async function emitUserNotification(
  input: EmitUserNotificationInput,
): Promise<{ emitted: number; skipped: number }> {
  const definition = NOTIFICATION_TYPE_CATALOG[input.type] as NotificationTypeDefinition;

  if (definition.scope === "workspace" && !input.context.workspaceId) {
    throw new Error(`Notification ${input.type} requires workspaceId`);
  }
  if (definition.scope === "user" && input.context.workspaceId) {
    // workspaceId may be set for display; scope user means notification is user-global in DB
  }

  const parsedPayload = definition.metadataSchema.parse(input.context.payload);
  const context: EmitContext = {
    ...input.context,
    payload: parsedPayload,
  };

  const dedupeKey = definition.dedupeKey(context);
  if (!dedupeKey) {
    throw new Error(`Notification ${input.type} requires dedupeKey`);
  }

  const href = definition.href(context);
  const primary = definition.primaryAction?.(context);
  const secondary = definition.secondaryAction?.(context);

  const recipientUserIds =
    input.recipientUserIds ??
    (await resolveRecipients({
      token: definition.defaultRecipients,
      workspaceId: input.context.workspaceId,
      actorUserId: input.context.actorUserId,
      inviteeEmail: input.context.inviteeEmail,
      referrerUserId: input.context.referrerUserId,
      userIds: input.context.userIds,
    }));

  const workspaceIdForRow = definition.scope === "workspace" ? (input.context.workspaceId ?? null) : null;

  let emitted = 0;
  let skipped = 0;

  for (const userId of recipientUserIds) {
    const enabled = await isNotificationCategoryEnabled(userId, definition.category);
    if (!enabled) {
      skipped += 1;
      continue;
    }

    const result = await createNotificationRecord({
      userId,
      workspaceId: workspaceIdForRow,
      type: input.type as NotificationType,
      state: definition.state,
      priority: definition.priority,
      dedupeKey,
      href,
      primaryActionLabelKey: primary?.labelKey ?? null,
      primaryActionHref: primary?.href ?? null,
      secondaryActionLabelKey: secondary?.labelKey ?? null,
      secondaryActionHref: secondary?.href ?? null,
      payload: parsedPayload,
    });

    if (result.created) {
      emitted += 1;
    } else {
      skipped += 1;
    }
  }

  return { emitted, skipped };
}
