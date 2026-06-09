import type { EstimateVersionStatus } from "@prisma/client";

import { ESTIMATE_ACTIVITY_ACTIONS } from "@/features/estimates/lib/estimate-activity-types";
import type { EstimateActivityLogClient } from "@/features/estimates/lib/serialize-estimate-activity";

export type WorkflowStepId =
  | "inquiry"
  | "estimate"
  | "sent"
  | "negotiations"
  | "acceptance";

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
  lineItemCount: number;
  activityLogs: EstimateActivityLogClient[];
};

function findSentActivityDate(
  activityLogs: EstimateActivityLogClient[],
  versionNumber: number,
): string | null {
  const sentLog = activityLogs.find(
    (log) =>
      log.action === ESTIMATE_ACTIVITY_ACTIONS.sent_to_customer &&
      log.metadata.versionNumber === versionNumber,
  );

  return sentLog?.occurredAt ?? null;
}

function findAiGeneratedDate(
  activityLogs: EstimateActivityLogClient[],
  versionNumber: number,
): string | null {
  const aiLog = activityLogs.find(
    (log) =>
      log.action === ESTIMATE_ACTIVITY_ACTIONS.ai_generated &&
      log.metadata.versionNumber === versionNumber,
  );

  return aiLog?.occurredAt ?? null;
}

export function deriveEstimateWorkflowStatus(
  input: DeriveWorkflowInput,
): EstimateWorkflowStatus {
  const inquiryCompleted = input.hasEstimateRequest;
  const estimateCompleted = input.lineItemCount > 0;

  const sentActivityDate = findSentActivityDate(input.activityLogs, input.versionNumber);
  const sentCompleted =
    input.versionStatus === "SENT" || sentActivityDate != null;

  const sentDate =
    sentActivityDate ??
    (input.versionStatus === "SENT" ? input.versionUpdatedAt : null);

  const estimateDate =
    findAiGeneratedDate(input.activityLogs, input.versionNumber) ?? input.versionCreatedAt;

  const stepCompletion: Record<WorkflowStepId, boolean> = {
    inquiry: inquiryCompleted,
    estimate: estimateCompleted,
    sent: sentCompleted,
    negotiations: false,
    acceptance: false,
  };

  const stepDates: Record<WorkflowStepId, string | null> = {
    inquiry: inquiryCompleted ? input.estimateRequestCreatedAt : null,
    estimate: estimateCompleted ? estimateDate : null,
    sent: sentCompleted ? sentDate : null,
    negotiations: null,
    acceptance: null,
  };

  const stepOrder: WorkflowStepId[] = [
    "inquiry",
    "estimate",
    "sent",
    "negotiations",
    "acceptance",
  ];

  const firstIncompleteIndex = stepOrder.findIndex((id) => !stepCompletion[id]);

  const steps: WorkflowStep[] = stepOrder.map((id, index) => {
    let state: WorkflowStepState;

    if (stepCompletion[id]) {
      state = "completed";
    } else if (index === firstIncompleteIndex) {
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
