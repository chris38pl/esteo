export type NotificationInvitationPayload = {
  invitationId: string;
  invitationToken?: string;
  workspaceName?: string;
};

export function parseNotificationInvitationPayload(
  payload: unknown,
): NotificationInvitationPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const invitationId =
    typeof record.invitationId === "string" ? record.invitationId : null;

  if (!invitationId) {
    return null;
  }

  return {
    invitationId,
    invitationToken:
      typeof record.invitationToken === "string" ? record.invitationToken : undefined,
    workspaceName:
      typeof record.workspaceName === "string" ? record.workspaceName : undefined,
  };
}
