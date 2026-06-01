import type { SubscriptionPlan, User } from "@prisma/client";

import { prisma } from "@/db/client";
import { ensureBillingAccount } from "@/features/billing/server/provision-billing-account";
import { fetchClerkMetadataForUsers } from "@/features/users/server/clerk-user-metadata";
import { logAuditEvent } from "@/features/workspaces/server/repository";
import { buildPaginatedResult, toPrismaSkipTake } from "@/lib/pagination";
import type { PaginatedResult, PaginationParams } from "@/lib/pagination";
import { isPlatformAdmin } from "@/server/permissions/require-workspace";
import { PermissionError } from "@/server/permissions/errors";

const workspaceInclude = {
  where: { deletedAt: null },
  select: {
    id: true,
    _count: {
      select: {
        estimateRequests: true,
        estimates: true,
      },
    },
  },
} as const;

const membershipInclude = {
  where: {
    deletedAt: null,
    workspace: { deletedAt: null },
  },
  select: {
    workspace: {
      select: {
        id: true,
        _count: {
          select: {
            estimateRequests: true,
            estimates: true,
          },
        },
      },
    },
  },
} as const;

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  plan: SubscriptionPlan;
  provider: "google" | "standard";
  workspaceCount: number;
  estimateRequestCount: number;
  estimateCount: number;
  createdAt: Date;
  lastActiveAt: Date | null;
};

function assertPlatformAdminUser(user: User): void {
  if (!isPlatformAdmin(user)) {
    throw new PermissionError("Platform admin access required.");
  }
}

function aggregateUserWorkspaceStats(user: {
  ownedWorkspaces: Array<{
    id: string;
    _count: { estimateRequests: number; estimates: number };
  }>;
  workspaceMemberships: Array<{
    workspace: {
      id: string;
      _count: { estimateRequests: number; estimates: number };
    };
  }>;
}) {
  const workspaceStats = new Map<string, { estimateRequests: number; estimates: number }>();

  for (const workspace of user.ownedWorkspaces) {
    workspaceStats.set(workspace.id, workspace._count);
  }

  for (const membership of user.workspaceMemberships) {
    if (!workspaceStats.has(membership.workspace.id)) {
      workspaceStats.set(membership.workspace.id, membership.workspace._count);
    }
  }

  let estimateRequestCount = 0;
  let estimateCount = 0;

  for (const counts of workspaceStats.values()) {
    estimateRequestCount += counts.estimateRequests;
    estimateCount += counts.estimates;
  }

  return {
    workspaceCount: workspaceStats.size,
    estimateRequestCount,
    estimateCount,
  };
}

async function mapUsersToRows(
  users: Array<{
    id: string;
    clerkId: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    createdAt: Date;
    billingAccount: {
      subscription: { plan: SubscriptionPlan } | null;
    } | null;
    ownedWorkspaces: Array<{
      id: string;
      _count: { estimateRequests: number; estimates: number };
    }>;
    workspaceMemberships: Array<{
      workspace: {
        id: string;
        _count: { estimateRequests: number; estimates: number };
      };
    }>;
  }>,
): Promise<AdminUserRow[]> {
  const clerkMetadata = await fetchClerkMetadataForUsers(users.map((user) => user.clerkId));

  return users.map((user) => {
    const stats = aggregateUserWorkspaceStats(user);
    const clerk = clerkMetadata.get(user.clerkId);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      plan: user.billingAccount?.subscription?.plan ?? "FREE",
      provider: clerk?.provider ?? "standard",
      workspaceCount: stats.workspaceCount,
      estimateRequestCount: stats.estimateRequestCount,
      estimateCount: stats.estimateCount,
      createdAt: user.createdAt,
      lastActiveAt: clerk?.lastActiveAt ?? null,
    };
  });
}

const userListInclude = {
  billingAccount: {
    include: {
      subscription: {
        select: { plan: true },
      },
    },
  },
  ownedWorkspaces: workspaceInclude,
  workspaceMemberships: membershipInclude,
} as const;

export async function listAdminUsersPaginated(
  params: PaginationParams,
  filters?: { search?: string },
): Promise<PaginatedResult<AdminUserRow>> {
  const search = filters?.search?.trim();
  const where =
    search && search.length > 0
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

  const take = params.pageSize;

  const [initialUsers, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: toPrismaSkipTake(params).skip,
      take,
      include: userListInclude,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize));
  const normalizedPage = Math.min(params.page, totalPages);

  const users =
    normalizedPage === params.page
      ? initialUsers
      : await prisma.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: toPrismaSkipTake({ ...params, page: normalizedPage }).skip,
          take,
          include: userListInclude,
        });

  const rows = await mapUsersToRows(users);

  return buildPaginatedResult(rows, totalCount, { ...params, page: normalizedPage });
}

export async function adminSetUserPlan(admin: User, userId: string, plan: SubscriptionPlan) {
  assertPlatformAdminUser(admin);

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!targetUser) {
    throw new PermissionError("User not found.");
  }

  const billingAccount = await ensureBillingAccount(userId);

  const subscription = await prisma.subscription.upsert({
    where: { billingAccountId: billingAccount.id },
    create: {
      billingAccountId: billingAccount.id,
      plan,
      status: "ACTIVE",
    },
    update: {
      plan,
      status: "ACTIVE",
    },
  });

  await logAuditEvent({
    actorUserId: admin.id,
    entityType: "Subscription",
    entityId: subscription.id,
    action: "admin_plan_updated",
    diff: { userId, plan },
  });

  return subscription;
}
