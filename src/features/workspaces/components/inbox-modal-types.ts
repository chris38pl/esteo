import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import type { ReceivedOwnershipTransferView } from "@/features/workspaces/components/transfer-types";

export type ModalInboxItemView =
  | { kind: "invitation"; invitation: ReceivedInvitationView }
  | { kind: "transfer"; transfer: ReceivedOwnershipTransferView };
