import assert from "node:assert/strict";

import { parseNotificationInvitationPayload } from "@/features/notifications/lib/notification-invitation-payload";
import { isPendingInvitationForRecipient } from "@/features/workspaces/lib/invitation-token-access";

assert.equal(parseNotificationInvitationPayload(null), null);
assert.deepEqual(
  parseNotificationInvitationPayload({
    invitationId: "inv-1",
    invitationToken: "tok-1",
    workspaceName: "Acme",
  }),
  {
    invitationId: "inv-1",
    invitationToken: "tok-1",
    workspaceName: "Acme",
  },
);

const validInvitation = {
  email: "user@example.com",
  status: "PENDING",
  expiresAt: new Date(Date.now() + 60_000),
  workspace: { deletedAt: null },
};

assert.equal(isPendingInvitationForRecipient(validInvitation, "user@example.com"), true);
assert.equal(isPendingInvitationForRecipient(validInvitation, "other@example.com"), false);
assert.equal(
  isPendingInvitationForRecipient(
    { ...validInvitation, status: "ACCEPTED" },
    "user@example.com",
  ),
  false,
);

console.log("notification-invitation-payload.test.ts passed");
