import type { WorkspaceIndustry } from "@prisma/client";

export const ACTIVATION_STEP_IDS = [
  "create_estimate",
  "generate_pdf",
  "share_form",
] as const;

export type ActivationStepId = (typeof ACTIVATION_STEP_IDS)[number];

export type ActivationStep = {
  id: ActivationStepId;
  completed: boolean;
};

export type ActivationProgressClient = {
  eligible: boolean;
  industry: WorkspaceIndustry;
  latestEstimateId: string | null;
  hasPublicFormSubmission: boolean;
  steps: ActivationStep[];
  completedCount: number;
  totalCount: number;
};
