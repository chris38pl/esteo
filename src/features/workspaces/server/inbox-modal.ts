import { getNextModalInvitation } from "@/features/workspaces/server/invitation-inbox";
import { getNextModalOwnershipTransfer } from "@/features/workspaces/server/transfer-inbox";
import { toReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { toReceivedOwnershipTransferView } from "@/features/workspaces/components/transfer-types";
import type { ModalInboxItemView } from "@/features/workspaces/components/inbox-modal-types";

export type ModalInboxItem =
  | {
      kind: "invitation";
      invitation: NonNullable<Awaited<ReturnType<typeof getNextModalInvitation>>>;
    }
  | {
      kind: "transfer";
      transfer: NonNullable<Awaited<ReturnType<typeof getNextModalOwnershipTransfer>>>;
    };

export async function getNextModalInboxItem(email: string): Promise<ModalInboxItem | null> {
  const [invitation, transfer] = await Promise.all([
    getNextModalInvitation(email),
    getNextModalOwnershipTransfer(email),
  ]);

  if (!invitation && !transfer) {
    return null;
  }

  if (!invitation) {
    if (!transfer) {
      return null;
    }
    return { kind: "transfer", transfer };
  }

  if (!transfer) {
    return { kind: "invitation", invitation };
  }

  if (invitation.createdAt <= transfer.createdAt) {
    return { kind: "invitation", invitation };
  }

  return { kind: "transfer", transfer };
}

export function toModalInboxItemView(item: ModalInboxItem): ModalInboxItemView {
  if (item.kind === "invitation") {
    return {
      kind: "invitation",
      invitation: toReceivedInvitationView(item.invitation),
    };
  }

  return {
    kind: "transfer",
    transfer: toReceivedOwnershipTransferView(item.transfer),
  };
}
