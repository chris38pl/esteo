import { deriveEstimateWorkflowStatus } from "../src/features/estimates/lib/derive-estimate-workflow-status";
import { ESTIMATE_ACTIVITY_ACTIONS } from "../src/features/estimates/lib/estimate-activity-types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const noRequest = deriveEstimateWorkflowStatus({
  hasEstimateRequest: false,
  estimateRequestCreatedAt: null,
  versionCreatedAt: "2026-06-05T10:00:00.000Z",
  versionUpdatedAt: "2026-06-05T10:00:00.000Z",
  versionNumber: 1,
  versionStatus: "DRAFT",
  lineItemCount: 0,
  activityLogs: [],
});

assert(
  noRequest.steps[0].state === "current" && noRequest.steps[0].id === "inquiry",
  "without request, inquiry should be current",
);

const draftWithItems = deriveEstimateWorkflowStatus({
  hasEstimateRequest: true,
  estimateRequestCreatedAt: "2026-06-04T10:00:00.000Z",
  versionCreatedAt: "2026-06-05T10:00:00.000Z",
  versionUpdatedAt: "2026-06-05T10:00:00.000Z",
  versionNumber: 1,
  versionStatus: "DRAFT",
  lineItemCount: 5,
  activityLogs: [],
});

assert(draftWithItems.steps[0].state === "completed", "inquiry should be completed");
assert(draftWithItems.steps[1].state === "completed", "estimate should be completed");
assert(
  draftWithItems.steps[2].state === "current" && draftWithItems.steps[2].id === "sent",
  "sent should be current for draft with items",
);

const sentVersion = deriveEstimateWorkflowStatus({
  hasEstimateRequest: true,
  estimateRequestCreatedAt: "2026-06-04T10:00:00.000Z",
  versionCreatedAt: "2026-06-05T10:00:00.000Z",
  versionUpdatedAt: "2026-06-08T10:00:00.000Z",
  versionNumber: 3,
  versionStatus: "SENT",
  lineItemCount: 5,
  activityLogs: [],
});

assert(sentVersion.steps[2].state === "completed", "sent should be completed");
assert(
  sentVersion.steps[3].state === "current" && sentVersion.steps[3].id === "negotiations",
  "negotiations should be current when sent",
);

const sentViaActivity = deriveEstimateWorkflowStatus({
  hasEstimateRequest: true,
  estimateRequestCreatedAt: "2026-06-04T10:00:00.000Z",
  versionCreatedAt: "2026-06-05T10:00:00.000Z",
  versionUpdatedAt: "2026-06-05T12:00:00.000Z",
  versionNumber: 2,
  versionStatus: "DRAFT",
  lineItemCount: 3,
  activityLogs: [
    {
      id: "log-1",
      estimateId: "est-1",
      workspaceId: "ws-1",
      actorType: "USER",
      category: "SHARING",
      action: ESTIMATE_ACTIVITY_ACTIONS.sent_to_customer,
      metadata: { versionNumber: 2 },
      occurredAt: "2026-06-08T10:00:00.000Z",
      createdAt: "2026-06-08T10:00:00.000Z",
      actor: null,
    },
  ],
});

assert(sentViaActivity.steps[2].state === "completed", "sent via activity should be completed");
assert(
  sentViaActivity.steps[2].completedAt === "2026-06-08T10:00:00.000Z",
  "sent date should come from activity log",
);

console.log("verify-derive-estimate-workflow-status: ok");
