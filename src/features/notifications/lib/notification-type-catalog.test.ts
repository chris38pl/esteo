import assert from "node:assert/strict";

import { NOTIFICATION_TYPE_CATALOG } from "@/features/notifications/lib/notification-type-catalog";

const invitationContext = {
  locale: "pl",
  inviteeEmail: "invitee@example.com",
  payload: {
    invitationId: "inv-123",
    invitationToken: "token-abc",
    workspaceName: "Test 123",
  },
};

const definition = NOTIFICATION_TYPE_CATALOG.invitation_received;

const href = definition.href(invitationContext);
assert.equal(href, "/pl/dashboard/invitations/token-abc");

const primary = definition.primaryAction?.(invitationContext);
assert.equal(primary?.labelKey, "actions.acceptInvite");
assert.equal(primary?.href, "/pl/dashboard/invitations/token-abc?action=accept");

const secondary = definition.secondaryAction?.(invitationContext);
assert.equal(secondary?.labelKey, "actions.declineInvite");
assert.equal(secondary?.href, "/pl/dashboard/invitations/token-abc?action=decline");

console.log("notification-type-catalog.test.ts passed");
