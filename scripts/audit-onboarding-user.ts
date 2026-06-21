import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: process.env.ENV_FILE ?? ".env.staging.local" });

const prisma = new PrismaClient();

const email = process.argv[2] ?? "krzysztofkrawiec94@gmail.com";
const sinceHours = Number(process.argv[3] ?? "24");

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, createdAt: true, lastActiveWorkspaceId: true },
  });

  if (!user) {
    console.log(JSON.stringify({ status: "USER_NOT_FOUND", email }, null, 2));
    return;
  }

  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

  const [workspaces, allWorkspaces, audits, orphanBilling, recentWorkspaces, esteoDev, recentAuditsForUser] =
    await Promise.all([
    prisma.workspace.findMany({
      where: { ownerId: user.id, deletedAt: null },
      select: {
        id: true,
        slug: true,
        name: true,
        createdAt: true,
        deletedAt: true,
        isActiveFree: true,
        provisioningStatus: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspace.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        slug: true,
        name: true,
        createdAt: true,
        deletedAt: true,
        isActiveFree: true,
        provisioningStatus: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { actorUserId: user.id, action: "created", entityType: "Workspace" },
      select: { createdAt: true, action: true, entityId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.billingAccount.findMany({
      where: { ownerUserId: user.id, workspaceId: null },
      select: { id: true, createdAt: true, workspaceId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspace.findMany({
      where: {
        createdAt: { gte: since },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        createdAt: true,
        deletedAt: true,
        owner: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.workspace.findFirst({
      where: { slug: "esteo-dev" },
      select: {
        id: true,
        slug: true,
        name: true,
        createdAt: true,
        deletedAt: true,
        owner: { select: { email: true, id: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        actorUserId: user.id,
        action: "created",
        entityType: "Workspace",
        createdAt: { gte: since },
      },
      select: { createdAt: true, action: true, entityId: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        user,
        workspaceCount: workspaces.length,
        workspaces,
        allWorkspaceCount: allWorkspaces.length,
        allWorkspaces,
        auditCreatedCount: audits.length,
        audits,
        orphanBillingCount: orphanBilling.length,
        orphanBilling,
        recentWorkspacesToday: recentWorkspaces,
        recentAuditsForUser,
        sinceHours,
        esteoDevWorkspace: esteoDev,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("ERROR", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
