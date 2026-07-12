import type {
  InboxCounts,
  InboxItem,
} from "@/server/client-api/dto/v1/inbox/dto";

export type InboxItemInput = {
  id: string;
  type: string;
  state: string;
  priority: string;
  href: string;
  primaryActionLabelKey: string | null;
  primaryActionHref: string | null;
  secondaryActionLabelKey: string | null;
  secondaryActionHref: string | null;
  payload: unknown;
  readAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  workspaceId: string | null;
  workspaceName: string | null;
};

export type InboxCountsInput = {
  total: number;
  unread: number;
  actionRequired: number;
};

/** Pure: notification list item -> InboxItem DTO. `read` is derived state. */
export function toInboxItem(item: InboxItemInput): InboxItem {
  return {
    id: item.id,
    type: item.type,
    state: item.state,
    priority: item.priority,
    href: item.href,
    read: item.readAt !== null,
    primaryActionLabelKey: item.primaryActionLabelKey,
    primaryActionHref: item.primaryActionHref,
    secondaryActionLabelKey: item.secondaryActionLabelKey,
    secondaryActionHref: item.secondaryActionHref,
    payload: item.payload,
    readAt: item.readAt ? item.readAt.toISOString() : null,
    resolvedAt: item.resolvedAt ? item.resolvedAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
    workspaceId: item.workspaceId,
    workspaceName: item.workspaceName,
  };
}

/** Pure: notification counts -> InboxCounts DTO. */
export function toInboxCounts(counts: InboxCountsInput): InboxCounts {
  return {
    total: counts.total,
    unread: counts.unread,
    actionRequired: counts.actionRequired,
  };
}
