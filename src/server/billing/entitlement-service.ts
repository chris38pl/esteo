import { cache } from "react";
import type { SubscriptionPlan } from "@prisma/client";

import { prisma } from "@/db/client";
import { getWorkspaceEffectiveStatus } from "@/server/billing/effective-status";
import { resolvePlanLimits, type PlanLimits } from "@/server/billing/plan-catalog";
import {
  currentPeriodKey,
  getWorkspaceMeterUsage,
  reconcileEstimateUsageAggregate,
} from "@/server/billing/usage-service";
import type {
  Feature,
  FeatureState,
  WorkspaceEffectiveStatus,
} from "@/server/permissions/domain";
import { EntitlementError } from "@/server/permissions/errors";

export type WorkspaceEntitlements = {
  workspaceId: string;
  plan: SubscriptionPlan;
  planVersion: string | null;
  effectiveStatus: WorkspaceEffectiveStatus;
  limits: PlanLimits;
  usage: {
    estimatesThisMonth: number;
    aiCallsThisMonth: number;
  };
  seats: {
    used: number;
    reserved: number;
    limit: number | null;
  };
};

type WorkspacePlanRow = {
  plan: SubscriptionPlan;
  planVersion: string | null;
};

const loadWorkspacePlan = cache(
  async (workspaceId: string): Promise<WorkspacePlanRow> => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        billingAccount: {
          select: { subscription: { select: { plan: true, planVersion: true } } },
        },
      },
    });

    const sub = workspace?.billingAccount?.subscription;
    return { plan: sub?.plan ?? "FREE", planVersion: sub?.planVersion ?? null };
  },
);

/**
 * Counts the seats a workspace is consuming: ACTIVE non-owner members PLUS pending invitations
 * (each pending invite reserves a seat so a downgrade/race can't over-fill).
 */
export async function getSeatUsage(
  workspaceId: string,
): Promise<{ used: number; reserved: number }> {
  const [used, reserved] = await Promise.all([
    prisma.workspaceMember.count({
      where: {
        workspaceId,
        deletedAt: null,
        state: "ACTIVE",
        role: { not: "OWNER" },
      },
    }),
    prisma.workspaceInvitation.count({
      where: { workspaceId, status: "PENDING" },
    }),
  ]);

  return { used, reserved };
}

/**
 * Pure feature-state derivation from effective status + plan limits. Single resolver used by
 * server guards and UI gating; never destroys configuration — only degrades behavior.
 */
export function deriveFeatureState(
  effectiveStatus: WorkspaceEffectiveStatus,
  plan: SubscriptionPlan,
  limits: PlanLimits,
  feature: Feature,
): FeatureState {
  if (effectiveStatus === "SUSPENDED" || effectiveStatus === "PENDING_DELETION") {
    return "DISABLED";
  }

  // Plan availability (independent of lifecycle).
  if (feature === "INVITES" && limits.maxInvitedSeats === 0) {
    return "DISABLED";
  }
  if (feature === "CLIENT_PORTAL" && plan === "FREE") {
    return "DISABLED";
  }

  // Read-only lifecycle states: existing data viewable, no new actions.
  if (
    effectiveStatus === "EXPIRED" ||
    effectiveStatus === "ARCHIVED" ||
    effectiveStatus === "INCOMPLETE"
  ) {
    return "READ_ONLY";
  }

  // Grace blocks expansion (creation/invites/AI) but keeps reads + portal live.
  if (effectiveStatus === "GRACE_PERIOD") {
    if (
      feature === "ESTIMATES" ||
      feature === "AI_ASSISTANT" ||
      feature === "PDF" ||
      feature === "INVITES"
    ) {
      return "READ_ONLY";
    }
    return "ACTIVE";
  }

  // ACTIVE / PAST_DUE — full access.
  return "ACTIVE";
}

/** Granular per-feature state for a workspace (server guards + UI gating). */
export async function getFeatureState(
  workspaceId: string,
  feature: Feature,
): Promise<FeatureState> {
  const [{ plan, planVersion }, effectiveStatus] = await Promise.all([
    loadWorkspacePlan(workspaceId),
    getWorkspaceEffectiveStatus(workspaceId),
  ]);
  const limits = resolvePlanLimits(plan, planVersion);
  return deriveFeatureState(effectiveStatus ?? "ACTIVE", plan, limits, feature);
}

/** Coarse entitlement snapshot — hydrates UI/context once per request. */
export const getWorkspaceEntitlements = cache(
  async (workspaceId: string): Promise<WorkspaceEntitlements> => {
    const periodKey = currentPeriodKey();
    await reconcileEstimateUsageAggregate(workspaceId, periodKey);

    const [{ plan, planVersion }, effectiveStatus, estimatesThisMonth, aiCallsThisMonth, seats] =
      await Promise.all([
        loadWorkspacePlan(workspaceId),
        getWorkspaceEffectiveStatus(workspaceId),
        getWorkspaceMeterUsage(workspaceId, "ESTIMATE_CREATED", periodKey),
        getWorkspaceMeterUsage(workspaceId, "AI_ASSISTANT_CALL", periodKey),
        getSeatUsage(workspaceId),
      ]);

    const limits = resolvePlanLimits(plan, planVersion);

    return {
      workspaceId,
      plan,
      planVersion,
      effectiveStatus: effectiveStatus ?? "ACTIVE",
      limits,
      usage: { estimatesThisMonth, aiCallsThisMonth },
      seats: { used: seats.used, reserved: seats.reserved, limit: limits.maxInvitedSeats },
    };
  },
);

// ---------------------------------------------------------------------------
// Guards (entitlement-only; callers must independently satisfy RBAC).
// ---------------------------------------------------------------------------

export type EstimateProcessingGateReason = "PLAN_LIMIT" | "READ_ONLY" | "FEATURE_DISABLED";

export type EstimateProcessingGate =
  | { allowed: true }
  | { allowed: false; reason: EstimateProcessingGateReason };

/** Non-throwing gate for public intake — same rules as {@link assertCanCreateEstimateInWorkspace}. */
export function deriveEstimateProcessingGate(
  ent: Pick<WorkspaceEntitlements, "effectiveStatus" | "plan" | "limits" | "usage">,
): EstimateProcessingGate {
  const state = deriveFeatureState(ent.effectiveStatus, ent.plan, ent.limits, "ESTIMATES");

  if (state !== "ACTIVE") {
    return {
      allowed: false,
      reason:
        ent.effectiveStatus === "GRACE_PERIOD" || ent.effectiveStatus === "EXPIRED"
          ? "READ_ONLY"
          : "FEATURE_DISABLED",
    };
  }

  if (
    ent.limits.maxEstimatesPerMonth !== null &&
    ent.usage.estimatesThisMonth >= ent.limits.maxEstimatesPerMonth
  ) {
    return { allowed: false, reason: "PLAN_LIMIT" };
  }

  return { allowed: true };
}

export async function getEstimateProcessingGate(
  workspaceId: string,
): Promise<EstimateProcessingGate> {
  const ent = await getWorkspaceEntitlements(workspaceId);
  return deriveEstimateProcessingGate(ent);
}

export async function assertCanCreateEstimateInWorkspace(workspaceId: string): Promise<void> {
  const gate = await getEstimateProcessingGate(workspaceId);

  if (!gate.allowed) {
    if (gate.reason === "PLAN_LIMIT") {
      throw new EntitlementError("Monthly estimate limit reached for your plan.", "PLAN_LIMIT");
    }

    throw new EntitlementError(
      "Estimate creation is not available for this workspace right now.",
      gate.reason === "READ_ONLY" ? "READ_ONLY_EXPIRED" : "FEATURE_DISABLED",
    );
  }
}

export async function assertCanUseAiAssistantInWorkspace(workspaceId: string): Promise<void> {
  const ent = await getWorkspaceEntitlements(workspaceId);
  const state = deriveFeatureState(ent.effectiveStatus, ent.plan, ent.limits, "AI_ASSISTANT");

  if (state !== "ACTIVE") {
    throw new EntitlementError(
      "The AI assistant is not available for this workspace right now.",
      "AI_ASSISTANT_LIMIT",
    );
  }

  if (
    ent.limits.maxAiAssistantCallsPerMonth !== null &&
    ent.usage.aiCallsThisMonth >= ent.limits.maxAiAssistantCallsPerMonth
  ) {
    throw new EntitlementError(
      "Monthly AI assistant call limit reached for your plan.",
      "AI_ASSISTANT_LIMIT",
    );
  }
}

/** The single seat gate, used at both invite-time and accept-time to close the race. */
export async function assertWorkspaceHasSeat(workspaceId: string): Promise<void> {
  const ent = await getWorkspaceEntitlements(workspaceId);
  const state = deriveFeatureState(ent.effectiveStatus, ent.plan, ent.limits, "INVITES");

  if (state === "DISABLED") {
    throw new EntitlementError("Member seats are not available on this plan.", "WORKSPACE_SEAT_LIMIT");
  }

  if (state !== "ACTIVE") {
    throw new EntitlementError(
      "Member seats are not available for this workspace right now.",
      "WORKSPACE_SEAT_LIMIT",
    );
  }

  if (ent.seats.limit !== null && ent.seats.used + ent.seats.reserved >= ent.seats.limit) {
    throw new EntitlementError("Member limit reached for this workspace.", "WORKSPACE_SEAT_LIMIT");
  }
}

export async function getMaxUndoStepsForWorkspace(workspaceId: string): Promise<number> {
  const { plan, planVersion } = await loadWorkspacePlan(workspaceId);
  return resolvePlanLimits(plan, planVersion).maxUndoSteps;
}

/** Blocks attachment uploads when storage feature is not ACTIVE or capacity is exhausted. */
export async function assertCanUploadAttachmentInWorkspace(
  workspaceId: string,
  additionalBytes: number,
): Promise<void> {
  const state = await getFeatureState(workspaceId, "STORAGE");
  if (state !== "ACTIVE") {
    throw new EntitlementError(
      "File uploads are not available for this workspace right now.",
      state === "READ_ONLY" ? "READ_ONLY_EXPIRED" : "FEATURE_DISABLED",
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { attachmentStorageUsedBytes: true, attachmentStorageLimitBytes: true },
  });

  if (!workspace) {
    throw new EntitlementError("Workspace not found.", "FEATURE_DISABLED");
  }

  const next = workspace.attachmentStorageUsedBytes + BigInt(additionalBytes);
  if (next > workspace.attachmentStorageLimitBytes) {
    throw new EntitlementError("Workspace attachment storage limit reached.", "STORAGE_LIMIT");
  }
}

/** Resolve the active plan for a workspace (e.g. PDF watermark, badges). */
export async function getWorkspacePlan(workspaceId: string): Promise<SubscriptionPlan> {
  const { plan } = await loadWorkspacePlan(workspaceId);
  return plan;
}
