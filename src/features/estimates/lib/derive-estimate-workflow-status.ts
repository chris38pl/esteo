import type { EstimateVersionStatus } from "@prisma/client";

import { ESTIMATE_ACTIVITY_ACTIONS } from "@/features/estimates/lib/estimate-activity-types";
import type { EstimateActivityLogClient } from "@/features/estimates/lib/serialize-estimate-activity";

export type WorkflowStepId = "inquiry" | "estimate" | "sent" | "acceptance";

export type WorkflowStepState = "completed" | "current" | "pending";

export type WorkflowStep = {
  id: WorkflowStepId;
  state: WorkflowStepState;
  completedAt: string | null;
};

export type EstimateWorkflowStatus = {
  steps: WorkflowStep[];
};

type DeriveWorkflowInput = {
  hasEstimateRequest: boolean;
  estimateRequestCreatedAt: string | null;
  versionCreatedAt: string;
  versionUpdatedAt: string;
  versionNumber: number;
  versionStatus: EstimateVersionStatus;
  acceptedAt?: string | null;
  lineItemCount: number;
  activityLogs: EstimateActivityLogClient[];
};

function findActivityDate(
  activityLogs: EstimateActivityLogClient[],
  versionNumber: number,
  action: string,
): string | null {
  const log = activityLogs.find(
    (entry) =>
      entry.action === action && entry.metadata.versionNumber === versionNumber,
  );

  return log?.occurredAt ?? null;
}

export function deriveEstimateWorkflowStatus(
  input: DeriveWorkflowInput,
): EstimateWorkflowStatus {
  const inquiryCompleted = input.hasEstimateRequest;
  const estimateCompleted = input.lineItemCount > 0;

  const sentActivityDate = findActivityDate(
    input.activityLogs,
    input.versionNumber,
    ESTIMATE_ACTIVITY_ACTIONS.sent_to_customer,
  );
  const sentCompleted =
    input.versionStatus === "SENT" ||
    input.versionStatus === "ACCEPTED" ||
    input.versionStatus === "REJECTED" ||
    sentActivityDate != null;

  const sentDate =
    sentActivityDate ??
    (input.versionStatus !== "DRAFT" ? input.versionUpdatedAt : null);

  const estimateDate =
    findActivityDate(
      input.activityLogs,
      input.versionNumber,
      ESTIMATE_ACTIVITY_ACTIONS.ai_generated,
    ) ?? input.versionCreatedAt;

  const acceptedActivityDate = findActivityDate(
    input.activityLogs,
    input.versionNumber,
    ESTIMATE_ACTIVITY_ACTIONS.estimate_accepted,
  );
  const acceptanceCompleted = input.versionStatus === "ACCEPTED";
  const acceptanceDate = acceptanceCompleted
    ? (acceptedActivityDate ?? input.acceptedAt ?? input.versionUpdatedAt)
    : null;

  const stepCompletion: Record<WorkflowStepId, boolean> = {
    inquiry: inquiryCompleted,
    estimate: estimateCompleted,
    sent: sentCompleted,
    acceptance: acceptanceCompleted,
  };

  const stepDates: Record<WorkflowStepId, string | null> = {
    inquiry: inquiryCompleted ? input.estimateRequestCreatedAt : null,
    estimate: estimateCompleted ? estimateDate : null,
    sent: sentCompleted ? sentDate : null,
    acceptance: acceptanceDate,
  };

  const stepOrder: WorkflowStepId[] = ["inquiry", "estimate", "sent", "acceptance"];

  let currentStepId: WorkflowStepId | null = null;

  if (input.versionStatus === "REJECTED" && sentCompleted && !acceptanceCompleted) {
    currentStepId = "sent";
  } else {
    currentStepId = stepOrder.find((id) => !stepCompletion[id]) ?? null;
  }

  const steps: WorkflowStep[] = stepOrder.map((id) => {
    let state: WorkflowStepState;

    if (stepCompletion[id]) {
      state = "completed";
    } else if (id === currentStepId) {
      state = "current";
    } else {
      state = "pending";
    }

    return {
      id,
      state,
      completedAt: stepDates[id],
    };
  });

  return { steps };
}
