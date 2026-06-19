export { PermissionError, EntitlementError, WorkspaceError } from "@/server/permissions/errors";
export {
  assertEntitlement,
  assertPaidPlan,
} from "@/server/permissions/assert-entitlement";
export {
  assertCanCreateEstimate,
  assertCanCreateFreeWorkspace,
  assertCanCreateWorkspace,
  assertCanInviteMember,
  canInviteWorkspaceMembers,
  canUserCreateWorkspace,
  countActiveFreeWorkspaces,
  countInvitedSeats,
  countOwnedWorkspaces,
  getEntitlements,
  getMaxUndoSteps,
  incrementAiAssistantUsage,
  incrementEstimateUsage,
  isPaidSubscriptionStatus,
  PLAN_ENTITLEMENTS,
  type PlanEntitlements,
} from "@/server/permissions/entitlements";
export type {
  Feature,
  FeatureState,
  WorkspaceEffectiveStatus,
} from "@/server/permissions/domain";
export {
  assertCanCreateEstimateInWorkspace,
  assertCanUploadAttachmentInWorkspace,
  assertCanUseAiAssistantInWorkspace,
  assertWorkspaceHasSeat,
  deriveFeatureState,
  deriveEstimateProcessingGate,
  getEstimateProcessingGate,
  getFeatureState,
  getMaxUndoStepsForWorkspace,
  getSeatUsage,
  getWorkspaceEntitlements,
  getWorkspacePlan,
  type EstimateProcessingGate,
  type EstimateProcessingGateReason,
  type WorkspaceEntitlements,
} from "@/server/billing/entitlement-service";
export {
  compareRoles,
  hasMinimumRole,
  WORKSPACE_ROLE_RANK,
} from "@/server/permissions/roles";
export {
  filterWorkspaceMembersForUi,
  getWorkspaceMembership,
  canAccessIssueTriage,
  isPlatformAdmin,
  isQaTester,
  requireRole,
  requireWorkspace,
  type WorkspaceContext,
} from "@/server/permissions/require-workspace";
