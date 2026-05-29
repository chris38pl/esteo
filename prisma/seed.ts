import {
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
  WorkspaceLocale,
  WorkspaceRole,
} from "@prisma/client";

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
  industry: "construction",
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
    },
    create: {
      email: DEV_OWNER.email,
      clerkId: DEV_OWNER.clerkId,
      name: DEV_OWNER.name,
    },
  });

  const billingAccount = await prisma.billingAccount.upsert({
    where: { ownerUserId: owner.id },
    update: {},
    create: { ownerUserId: owner.id },
  });

  await prisma.subscription.upsert({
    where: { billingAccountId: billingAccount.id },
    update: {
      plan: subscriptionPlan,
      status: SubscriptionStatus.ACTIVE,
    },
    create: {
      billingAccountId: billingAccount.id,
      plan: subscriptionPlan,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: DEV_WORKSPACE.slug },
    update: {
      name: DEV_WORKSPACE.name,
      industry: DEV_WORKSPACE.industry,
      ownerId: owner.id,
      billingAccountId: billingAccount.id,
      deletedAt: null,
    },
    create: {
      billingAccountId: billingAccount.id,
      ownerId: owner.id,
      name: DEV_WORKSPACE.name,
      slug: DEV_WORKSPACE.slug,
      industry: DEV_WORKSPACE.industry,
      defaultLocale: WorkspaceLocale.PL,
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

  console.log("Seed completed.");
  console.log(`  Owner:        ${owner.email} (${owner.id})`);
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
