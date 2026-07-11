import { prisma } from "@/db/client";
import { getWorkspaceEffectiveStatus } from "@/server/billing/effective-status";
import { getSeatUsage } from "@/server/billing/entitlement-service";

export type WorkspaceListEntry = {
  slug: string;
  plan: string;
  effectiveStatus: string;
  ownerEmail: string;
  seatsUsed: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
};

export async function listWorkspacesBillingSummary(options?: {
  ownerEmail?: string;
}): Promise<WorkspaceListEntry[]> {
  const ownerFilter = options?.ownerEmail?.trim();

  const workspaces = await prisma.workspace.findMany({
    where: {
      deletedAt: null,
      ...(ownerFilter
        ? { owner: { email: { equals: ownerFilter, mode: "insensitive" } } }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      owner: { select: { email: true } },
      billingAccount: {
        select: {
          subscription: {
            select: {
              plan: true,
              cancelAtPeriodEnd: true,
              currentPeriodEnd: true,
            },
          },
        },
      },
    },
    orderBy: { slug: "asc" },
  });

  const entries: WorkspaceListEntry[] = [];

  for (const workspace of workspaces) {
    const [effectiveStatus, seats] = await Promise.all([
      getWorkspaceEffectiveStatus(workspace.id),
      getSeatUsage(workspace.id),
    ]);

    const subscription = workspace.billingAccount?.subscription;

    entries.push({
      slug: workspace.slug,
      plan: subscription?.plan ?? "FREE",
      effectiveStatus: effectiveStatus ?? "ACTIVE",
      ownerEmail: workspace.owner.email,
      seatsUsed: seats.used,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    });
  }

  return entries;
}

export function formatWorkspaceList(entries: WorkspaceListEntry[]): string {
  if (entries.length === 0) {
    return "No workspaces found.";
  }

  const blocks = entries.map((entry) => {
    const lines = [
      entry.slug,
      entry.plan,
      entry.effectiveStatus,
      entry.ownerEmail,
      `seats: ${entry.seatsUsed}`,
      formatBillingLine(entry),
    ];
    return lines.join("\n");
  });

  return `${blocks.join("\n\n")}\n\nTotal: ${entries.length}`;
}

function formatBillingLine(entry: WorkspaceListEntry): string {
  if (entry.plan === "FREE") {
    return "billing: -";
  }

  const periodEnd = entry.currentPeriodEnd
    ? formatDateOnly(entry.currentPeriodEnd)
    : null;

  if (entry.cancelAtPeriodEnd) {
    return periodEnd
      ? `billing: canceling (active until ${periodEnd})`
      : "billing: canceling (active until period end)";
  }

  return periodEnd ? `billing: renews ${periodEnd}` : "billing: renews -";
}

function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
