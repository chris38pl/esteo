export type ReceivedInvitationView = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  role: "MEMBER" | "VIEWER";
  invitedByName: string | null;
  invitedByEmail: string;
  expiresAt: string;
  promptDismissedAt: string | null;
};

export function toReceivedInvitationView(invitation: {
  id: string;
  workspaceId: string;
  role: "MEMBER" | "VIEWER";
  expiresAt: Date;
  promptDismissedAt: Date | null;
  workspace: { name: string };
  invitedBy: { name: string | null; email: string };
}): ReceivedInvitationView {
  return {
    id: invitation.id,
    workspaceId: invitation.workspaceId,
    workspaceName: invitation.workspace.name,
    role: invitation.role,
    invitedByName: invitation.invitedBy.name,
    invitedByEmail: invitation.invitedBy.email,
    expiresAt: invitation.expiresAt.toISOString(),
    promptDismissedAt: invitation.promptDismissedAt?.toISOString() ?? null,
  };
}
