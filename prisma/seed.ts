import {
  PlatformRole,
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
  WorkspaceIndustry,
  WorkspaceLocale,
  WorkspaceProvisioningStatus,
  WorkspaceRole,
} from "@prisma/client";

import { seedConstructionEstimateRequestFields } from "./seed-industry-fields";

const prisma = new PrismaClient();

/** Default when no CLI flag or SEED_SUBSCRIPTION_PLAN env is set. */
const DEV_SUBSCRIPTION_PLAN: SubscriptionPlan = SubscriptionPlan.FREE;

/**
 * Run:
 *   npm run prisma:reset              (migrations only, no seed)
 *   npm run prisma:seed               (seed only)
 *   npm run prisma:seed -- --plan PRO
 *   npm run prisma:seed:pro
 *   npm run prisma:seed:business
 *   $env:SEED_SUBSCRIPTION_PLAN="PRO"; npm run prisma:reset   (PowerShell, for migrate reset)
 */

const DEV_OWNER = {
  email: "chris38pl@gmail.com",
  clerkId: "user_3EJtUJXlO1uSiYIEBZL13zaQ58m",
  name: "Krzysztof Krawiec",
} as const;

const DEV_WORKSPACE = {
  slug: "esteo-dev",
  name: "Esteo Dev Workspace",
  industry: WorkspaceIndustry.CONSTRUCTION,
} as const;

const VALID_PLANS = new Set<string>(Object.values(SubscriptionPlan));

function isSubscriptionPlan(value: string): value is SubscriptionPlan {
  return VALID_PLANS.has(value);
}

/**
 * Plan resolution order:
 * 1. CLI: --plan PRO | --plan=PRO
 * 2. Env: SEED_SUBSCRIPTION_PLAN=PRO
 * 3. DEV_SUBSCRIPTION_PLAN constant
 */
function resolveSeedSubscriptionPlan(): SubscriptionPlan {
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--plan" && args[index + 1]) {
      const plan = args[index + 1].toUpperCase();
      if (isSubscriptionPlan(plan)) {
        return plan;
      }
      throw new Error(`Invalid --plan value "${args[index + 1]}". Use FREE, PRO, or BUSINESS.`);
    }

    if (arg.startsWith("--plan=")) {
      const plan = arg.slice("--plan=".length).toUpperCase();
      if (isSubscriptionPlan(plan)) {
        return plan;
      }
      throw new Error(`Invalid --plan value "${arg.slice("--plan=".length)}". Use FREE, PRO, or BUSINESS.`);
    }
  }

  const fromEnv = process.env.SEED_SUBSCRIPTION_PLAN?.trim().toUpperCase();
  if (fromEnv) {
    if (isSubscriptionPlan(fromEnv)) {
      return fromEnv;
    }
    throw new Error(`Invalid SEED_SUBSCRIPTION_PLAN "${fromEnv}". Use FREE, PRO, or BUSINESS.`);
  }

  return DEV_SUBSCRIPTION_PLAN;
}

async function main() {
  const subscriptionPlan = resolveSeedSubscriptionPlan();

  console.log("Seeding database...");
  console.log(`  Subscription plan: ${subscriptionPlan}`);

  const owner = await prisma.user.upsert({
    where: { email: DEV_OWNER.email },
    update: {
      name: DEV_OWNER.name,
      clerkId: DEV_OWNER.clerkId,
      platformRole: PlatformRole.PLATFORM_ADMIN,
    },
    create: {
      email: DEV_OWNER.email,
      clerkId: DEV_OWNER.clerkId,
      name: DEV_OWNER.name,
      platformRole: PlatformRole.PLATFORM_ADMIN,
    },
  });

  // Per-workspace billing: each workspace owns a 1:1 BillingAccount + Subscription. Reuse the
  // dev workspace's existing account when re-seeding so we don't orphan rows.
  const existingWorkspace = await prisma.workspace.findUnique({
    where: { slug: DEV_WORKSPACE.slug },
    select: { billingAccountId: true },
  });

  const billingAccount = existingWorkspace
    ? await prisma.billingAccount.update({
        where: { id: existingWorkspace.billingAccountId },
        data: { ownerUserId: owner.id, payerUserId: owner.id },
      })
    : await prisma.billingAccount.create({
        data: { ownerUserId: owner.id, payerUserId: owner.id },
      });

  const isFreePlan = subscriptionPlan === SubscriptionPlan.FREE;
  const planVersion = `${subscriptionPlan}_2026`;

  const workspace = await prisma.workspace.upsert({
    where: { slug: DEV_WORKSPACE.slug },
    update: {
      name: DEV_WORKSPACE.name,
      industry: DEV_WORKSPACE.industry,
      ownerId: owner.id,
      billingAccountId: billingAccount.id,
      isActiveFree: isFreePlan,
      provisioningStatus: WorkspaceProvisioningStatus.ACTIVE,
      deletedAt: null,
    },
    create: {
      billingAccountId: billingAccount.id,
      ownerId: owner.id,
      name: DEV_WORKSPACE.name,
      slug: DEV_WORKSPACE.slug,
      industry: DEV_WORKSPACE.industry,
      defaultLocale: WorkspaceLocale.PL,
      isActiveFree: isFreePlan,
      provisioningStatus: WorkspaceProvisioningStatus.ACTIVE,
    },
  });

  // Link the billing account to its workspace (1:1) and provision the subscription.
  await prisma.billingAccount.update({
    where: { id: billingAccount.id },
    data: { workspaceId: workspace.id },
  });

  await prisma.subscription.upsert({
    where: { billingAccountId: billingAccount.id },
    update: {
      plan: subscriptionPlan,
      planVersion,
      status: SubscriptionStatus.ACTIVE,
    },
    create: {
      billingAccountId: billingAccount.id,
      plan: subscriptionPlan,
      planVersion,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: owner.id,
      },
    },
    update: {
      role: WorkspaceRole.OWNER,
      deletedAt: null,
    },
    create: {
      workspaceId: workspace.id,
      userId: owner.id,
      role: WorkspaceRole.OWNER,
    },
  });

  await prisma.user.update({
    where: { id: owner.id },
    data: { lastActiveWorkspaceId: workspace.id },
  });

  await seedConstructionEstimateRequestFields(prisma);

  console.log("Seed completed.");
  console.log(`  Owner:        ${owner.email} (${owner.id})`);
  console.log(`  Platform role: ${owner.platformRole}`);
  console.log(`  Workspace:    ${workspace.name} /${workspace.slug} (${workspace.id})`);
  console.log(`  Subscription: ${subscriptionPlan} (ACTIVE, local seed — not from Stripe)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
