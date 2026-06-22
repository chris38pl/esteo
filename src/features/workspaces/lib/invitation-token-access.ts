type InvitationTokenRecord = {
  email: string;
  status: string;
  expiresAt: Date;
  workspace: { deletedAt: Date | null };
};

export function isPendingInvitationForRecipient(
  invitation: InvitationTokenRecord | null | undefined,
  recipientEmail: string,
): invitation is InvitationTokenRecord {
  if (!invitation) {
    return false;
  }

  if (invitation.status !== "PENDING") {
    return false;
  }

  if (invitation.expiresAt.getTime() <= Date.now()) {
    return false;
  }

  if (invitation.workspace.deletedAt) {
    return false;
  }

  return invitation.email.toLowerCase() === recipientEmail.toLowerCase();
}
