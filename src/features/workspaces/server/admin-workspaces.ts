import type {
  SubscriptionPlan,
  SubscriptionStatus,
  User,
  WorkspaceAppearanceTheme,
  WorkspaceIndustry,
  WorkspaceProvisioningStatus,
} from "@prisma/client";
import { randomUUID } from "crypto";

import { prisma } from "@/db/client";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import type { WorkspaceMemberPreview } from "@/features/workspaces/server/get-active-workspace-card-data";
import {
  createInvitationRecord,
  findPendingInvitation,
  logAuditEvent,
  revokeAllPendingWorkspaceInvitations,
  softDeleteWorkspaceRecord,
  updateWorkspaceRecord,
} from "@/features/workspaces/server/repository";
import { isValidWorkspaceSlug, normalizeWorkspaceSlug } from "@/features/workspaces/lib/slug";
import { isSlugAvailable, recordSlugAlias } from "@/features/workspaces/server/slug-availability";
import { deriveWorkspaceEffectiveStatus } from "@/server/billing/effective-status";
import { resolvePlanLimits } from "@/server/billing/plan-catalog";
import { currentPeriodKey, WORKSPACE_TOTAL_USER } from "@/server/billing/usage-service";
import { buildPaginatedResult, toPrismaSkipTake } from "@/lib/pagination";
import type { PaginatedResult, PaginationParams } from "@/lib/pagination";
import type { WorkspaceEffectiveStatus } from "@/server/permissions/domain";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";
import { PermissionError, WorkspaceError } from "@/server/permissions/errors";

const INVITATION_TTL_DAYS = 7;
const MEMBER_PREVIEW_LIMIT = 4;

const adminWorkspaceListInclude = {
  owner: {
    select: { id: true, name: true, email: true },
  },
  members: {
    where: { deletedAt: null },
    take: MEMBER_PREVIEW_LIMIT,
    orderBy: { createdAt: "asc" as const },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, avatarPreset: true },
      },
    },
  },
  billingAccount: {
    select: {
      subscription: {
        select: {
          plan: true,
          planVersion: true,
          status: true,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: true,
          graceEndsAt: true,
        },
      },
    },
  },
  _count: {
    select: {
      estimateRequests: true,
      estimates: true,
      members: { where: { deletedAt: null } },
    },
  },
} as const;

export type AdminWorkspaceBillingSummary = {
  planVersion: string | null;
  aiUsageUsed: number;
  aiUsageLimit: number | null;
  estimateUsageUsed: number;
  estimateUsageLimit: number | null;
  seatsUsed: number;
  seatsReserved: number;
  seatsLimit: number | null;
  storageUsedBytes: number;
  storageLimitBytes: number;
};

export type AdminWorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  appearanceTheme: WorkspaceAppearanceTheme;
  industry: WorkspaceIndustry;
  industryOtherText: string | null;
  createdAt: Date;
  updatedAt: Date;
  plan: SubscriptionPlan;
  effectiveStatus: WorkspaceEffectiveStatus;
  billing: AdminWorkspaceBillingSummary;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  estimateRequestCount: number;
  estimateCount: number;
  memberCount: number;
  memberPreviews: WorkspaceMemberPreview[];
};

type AdminWorkspaceListRecord = {
  id: string;
  name: string;
  slug: string;
  appearanceTheme: WorkspaceAppearanceTheme;
  industry: WorkspaceIndustry;
  industryOtherText: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  archivedAt: Date | null;
  platformSuspendedAt: Date | null;
  provisioningStatus: WorkspaceProvisioningStatus;
  attachmentStorageUsedBytes: bigint;
  attachmentStorageLimitBytes: bigint;
  owner: AdminWorkspaceRow["owner"];
  members: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
      avatarPreset: string | null;
    };
  }>;
  billingAccount: {
    subscription: {
      plan: SubscriptionPlan;
      planVersion: string | null;
      status: SubscriptionStatus;
      cancelAtPeriodEnd: boolean;
      currentPeriodEnd: Date | null;
      graceEndsAt: Date | null;
    } | null;
  } | null;
  _count: {
    estimateRequests: number;
    estimates: number;
    members: number;
  };
};

async function loadBillingSummariesForWorkspaces(
  workspaces: AdminWorkspaceListRecord[],
): Promise<Map<string, Omit<AdminWorkspaceBillingSummary, "planVersion" | "storageUsedBytes" | "storageLimitBytes">>> {
  const workspaceIds = workspaces.map((workspace) => workspace.id);
  if (workspaceIds.length === 0) {
    return new Map();
  }

  const periodKey = currentPeriodKey();

  const [usageRows, seatUsedRows, seatReservedRows] = await Promise.all([
    prisma.usagePeriodAggregate.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        userId: WORKSPACE_TOTAL_USER,
        periodKey,
        meter: { in: ["AI_ASSISTANT_CALL", "ESTIMATE_CREATED"] },
      },
      select: { workspaceId: true, meter: true, quantity: true },
    }),
    prisma.workspaceMember.groupBy({
      by: ["workspaceId"],
      where: {
        workspaceId: { in: workspaceIds },
        deletedAt: null,
        state: "ACTIVE",
        role: { not: "OWNER" },
      },
      _count: { _all: true },
    }),
    prisma.workspaceInvitation.groupBy({
      by: ["workspaceId"],
      where: { workspaceId: { in: workspaceIds }, status: "PENDING" },
      _count: { _all: true },
    }),
  ]);

  const usageByWorkspace = new Map<string, { ai: number; estimates: number }>();
  for (const row of usageRows) {
    const current = usageByWorkspace.get(row.workspaceId) ?? { ai: 0, estimates: 0 };
    if (row.meter === "AI_ASSISTANT_CALL") {
      current.ai = row.quantity;
    } else {
      current.estimates = row.quantity;
    }
    usageByWorkspace.set(row.workspaceId, current);
  }

  const seatsUsedByWorkspace = new Map(
    seatUsedRows.map((row) => [row.workspaceId, row._count._all]),
  );
  const seatsReservedByWorkspace = new Map(
    seatReservedRows.map((row) => [row.workspaceId, row._count._all]),
  );

  const summaries = new Map<
    string,
    Omit<AdminWorkspaceBillingSummary, "planVersion" | "storageUsedBytes" | "storageLimitBytes">
  >();

  for (const workspaceId of workspaceIds) {
    const usage = usageByWorkspace.get(workspaceId) ?? { ai: 0, estimates: 0 };
    summaries.set(workspaceId, {
      aiUsageUsed: usage.ai,
      aiUsageLimit: null,
      estimateUsageUsed: usage.estimates,
      estimateUsageLimit: null,
      seatsUsed: seatsUsedByWorkspace.get(workspaceId) ?? 0,
      seatsReserved: seatsReservedByWorkspace.get(workspaceId) ?? 0,
      seatsLimit: null,
    });
  }

  return summaries;
}

function mapWorkspaceToAdminRow(
  workspace: AdminWorkspaceListRecord,
  billingExtras: Omit<AdminWorkspaceBillingSummary, "planVersion" | "storageUsedBytes" | "storageLimitBytes">,
): AdminWorkspaceRow {
  const sub = workspace.billingAccount?.subscription ?? null;
  const plan = sub?.plan ?? "FREE";
  const planVersion = sub?.planVersion ?? null;
  const limits = resolvePlanLimits(plan, planVersion);

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    appearanceTheme: workspace.appearanceTheme,
    industry: workspace.industry,
    industryOtherText: workspace.industryOtherText,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
    plan,
    effectiveStatus: deriveWorkspaceEffectiveStatus({
      deletedAt: workspace.deletedAt,
      archivedAt: workspace.archivedAt,
      platformSuspendedAt: workspace.platformSuspendedAt,
      provisioningStatus: workspace.provisioningStatus,
      subscriptionStatus: sub?.status ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      graceEndsAt: sub?.graceEndsAt ?? null,
    }),
    billing: {
      planVersion,
      aiUsageUsed: billingExtras.aiUsageUsed,
      aiUsageLimit: limits.maxAiAssistantCallsPerMonth,
      estimateUsageUsed: billingExtras.estimateUsageUsed,
      estimateUsageLimit: limits.maxEstimatesPerMonth,
      seatsUsed: billingExtras.seatsUsed,
      seatsReserved: billingExtras.seatsReserved,
      seatsLimit: limits.maxInvitedSeats,
      storageUsedBytes: Number(workspace.attachmentStorageUsedBytes),
      storageLimitBytes: Number(workspace.attachmentStorageLimitBytes),
    },
    owner: workspace.owner,
    estimateRequestCount: workspace._count.estimateRequests,
    estimateCount: workspace._count.estimates,
    memberCount: workspace._count.members,
    memberPreviews: workspace.members.map((member) => ({
      id: member.user.id,
      name: member.user.name ?? member.user.email,
      imageUrl: member.user.avatarUrl,
      avatarPreset: isAvatarPreset(member.user.avatarPreset) ? member.user.avatarPreset : null,
    })),
  };
}

function assertPlatformAdminUser(user: User): void {
  if (!isPlatformAdmin(user)) {
    throw new PermissionError("Platform admin access required.");
  }
}

export async function listAdminWorkspacesPaginated(
  params: PaginationParams,
  filters?: { search?: string },
): Promise<PaginatedResult<AdminWorkspaceRow>> {
  const search = filters?.search?.trim();
  const where =
    search && search.length > 0
      ? {
          deletedAt: null,
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
            { owner: { email: { contains: search, mode: "insensitive" as const } } },
            { owner: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : { deletedAt: null };

  const take = params.pageSize;

  const [initialWorkspaces, totalCount] = await prisma.$transaction([
    prisma.workspace.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: toPrismaSkipTake(params).skip,
      take,
      include: adminWorkspaceListInclude,
    }),
    prisma.workspace.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize));
  const normalizedPage = Math.min(params.page, totalPages);

  const workspaces =
    normalizedPage === params.page
      ? initialWorkspaces
      : await prisma.workspace.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: toPrismaSkipTake({ ...params, page: normalizedPage }).skip,
          take,
          include: adminWorkspaceListInclude,
        });

  const rows: AdminWorkspaceRow[] = await mapWorkspacesToAdminRows(workspaces as AdminWorkspaceListRecord[]);

  return buildPaginatedResult(rows, totalCount, { ...params, page: normalizedPage });
}

async function mapWorkspacesToAdminRows(
  workspaces: AdminWorkspaceListRecord[],
): Promise<AdminWorkspaceRow[]> {
  const billingSummaries = await loadBillingSummariesForWorkspaces(workspaces);

  return workspaces.map((workspace) => {
    const billingExtras = billingSummaries.get(workspace.id) ?? {
      aiUsageUsed: 0,
      aiUsageLimit: null,
      estimateUsageUsed: 0,
      estimateUsageLimit: null,
      seatsUsed: 0,
      seatsReserved: 0,
      seatsLimit: null,
    };

    return mapWorkspaceToAdminRow(workspace, billingExtras);
  });
}

export async function adminUpdateWorkspace(
  admin: User,
  workspaceId: string,
  input: { name: string; slug: string },
) {
  assertPlatformAdminUser(admin);

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
  });

  if (!workspace) {
    throw new WorkspaceError("Workspace not found.");
  }

  const name = input.name.trim();
  const slug = normalizeWorkspaceSlug(input.slug);

  if (!name) {
    throw new WorkspaceError("Workspace name is required.");
  }

  if (!isValidWorkspaceSlug(slug)) {
    throw new WorkspaceError("Invalid workspace slug.");
  }

  if (!(await isSlugAvailable(slug, workspaceId))) {
    throw new WorkspaceError("Workspace slug is already taken.");
  }

  const oldSlug = workspace.slug;
  if (oldSlug !== slug) {
    await recordSlugAlias(workspaceId, oldSlug);
  }

  const updated = await updateWorkspaceRecord(workspaceId, { name, slug });

  await logAuditEvent({
    actorUserId: admin.id,
    workspaceId,
    entityType: "Workspace",
    entityId: workspaceId,
    action: "admin_updated",
    diff: { name, slug },
  });

  return updated;
}

export async function adminArchiveWorkspace(admin: User, workspaceId: string) {
  assertPlatformAdminUser(admin);

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
  });

  if (!workspace) {
    throw new WorkspaceError("Workspace not found.");
  }

  await revokeAllPendingWorkspaceInvitations(workspaceId);
  const archived = await softDeleteWorkspaceRecord(workspaceId);

  const { recomputeIsActiveFree } = await import(
    "@/server/billing/workspace-billing-maintenance"
  );
  await recomputeIsActiveFree(workspaceId);

  await logAuditEvent({
    actorUserId: admin.id,
    workspaceId,
    entityType: "Workspace",
    entityId: workspaceId,
    action: "admin_archived",
  });

  return archived;
}

export async function adminGetWorkspaceBillingReport(admin: User, workspaceSlug: string) {
  assertPlatformAdminUser(admin);

  const { buildWorkspaceBillingReport } = await import(
    "@/server/billing/dev-toolkit/report"
  );

  return buildWorkspaceBillingReport(workspaceSlug);
}

export async function adminInviteToWorkspace(
  admin: User,
  workspaceId: string,
  email: string,
) {
  assertPlatformAdminUser(admin);

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
  });

  if (!workspace) {
    throw new WorkspaceError("Workspace not found.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new WorkspaceError("Email is required.");
  }

  const pending = await findPendingInvitation(workspaceId, normalizedEmail);

  if (pending) {
    throw new WorkspaceError("An invitation is already pending for this email.");
  }

  const invitation = await createInvitationRecord({
    workspaceId,
    email: normalizedEmail,
    role: "MEMBER",
    token: randomUUID(),
    invitedById: admin.id,
    expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  await logAuditEvent({
    actorUserId: admin.id,
    workspaceId,
    entityType: "WorkspaceInvitation",
    entityId: invitation.id,
    action: "admin_created",
  });

  return invitation;
}
