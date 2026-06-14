-- Workspace Billing migration (schema / additive DDL).
-- Backward compatible: legacy columns (BillingAccount.workspaces 1:N, Workspace.billingAccountId)
-- are retained; the data backfill lives in the following migration.

-- AlterEnum: extend subscription lifecycle
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PAST_DUE';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'GRACE_PERIOD';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- AlterEnum: invitations can be parked on a downgrade
ALTER TYPE "InvitationStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';

-- CreateEnum
CREATE TYPE "WorkspaceMemberState" AS ENUM ('ACTIVE', 'SUSPENDED', 'REMOVED');
CREATE TYPE "WorkspaceMemberSuspendedReason" AS ENUM ('SEAT_OVERAGE', 'UNPAID', 'ADMIN');
CREATE TYPE "WorkspaceProvisioningStatus" AS ENUM ('INCOMPLETE', 'ACTIVE');
CREATE TYPE "UsageMeter" AS ENUM ('ESTIMATE_CREATED', 'AI_ASSISTANT_CALL');

-- AlterTable: Subscription (plan versioning + lifecycle)
ALTER TABLE "Subscription"
  ADD COLUMN "planVersion" TEXT,
  ADD COLUMN "stripePriceId" TEXT,
  ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "graceEndsAt" TIMESTAMP(3);

-- AlterTable: Workspace (slug ownership, FREE slot, lifecycle flags)
ALTER TABLE "Workspace"
  ADD COLUMN "slugIsCustom" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isActiveFree" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "provisioningStatus" "WorkspaceProvisioningStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "platformSuspendedAt" TIMESTAMP(3);

-- AlterTable: WorkspaceMember (membership state machine)
ALTER TABLE "WorkspaceMember"
  ADD COLUMN "state" "WorkspaceMemberState" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "suspendedReason" "WorkspaceMemberSuspendedReason",
  ADD COLUMN "suspendedAt" TIMESTAMP(3);

-- AlterTable: BillingAccount (1:1 workspace + payer + customer fk)
ALTER TABLE "BillingAccount"
  ADD COLUMN "payerUserId" TEXT,
  ADD COLUMN "workspaceId" TEXT,
  ADD COLUMN "billingCustomerId" TEXT;

-- Drop the old one-account-per-owner uniqueness; ownerUserId is now a denormalized helper.
DROP INDEX IF EXISTS "BillingAccount_ownerUserId_key";
-- The old stripeCustomerId lives on BillingCustomer now (dropped after backfill).

-- CreateTable: BillingCustomer
CREATE TABLE "BillingCustomer" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UsageEvent (append-only)
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "meter" "UsageMeter" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UsagePeriodAggregate (hot path)
CREATE TABLE "UsagePeriodAggregate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT '',
    "meter" "UsageMeter" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsagePeriodAggregate_pkey" PRIMARY KEY ("id")
);

-- Indexes / constraints
CREATE UNIQUE INDEX "BillingAccount_workspaceId_key" ON "BillingAccount"("workspaceId");
CREATE INDEX "BillingAccount_ownerUserId_idx" ON "BillingAccount"("ownerUserId");
CREATE INDEX "BillingAccount_billingCustomerId_idx" ON "BillingAccount"("billingCustomerId");

CREATE UNIQUE INDEX "BillingCustomer_stripeCustomerId_key" ON "BillingCustomer"("stripeCustomerId");
CREATE INDEX "BillingCustomer_ownerUserId_idx" ON "BillingCustomer"("ownerUserId");

CREATE INDEX "UsageEvent_workspaceId_meter_occurredAt_idx" ON "UsageEvent"("workspaceId", "meter", "occurredAt");
CREATE INDEX "UsageEvent_workspaceId_userId_meter_occurredAt_idx" ON "UsageEvent"("workspaceId", "userId", "meter", "occurredAt");

CREATE UNIQUE INDEX "UsagePeriodAggregate_workspaceId_userId_meter_periodKey_key" ON "UsagePeriodAggregate"("workspaceId", "userId", "meter", "periodKey");
CREATE INDEX "UsagePeriodAggregate_workspaceId_meter_periodKey_idx" ON "UsagePeriodAggregate"("workspaceId", "meter", "periodKey");

-- Partial unique index: at most one active FREE workspace per owner (the hard backstop for the FREE rule).
CREATE UNIQUE INDEX "Workspace_owner_active_free_key" ON "Workspace"("ownerId") WHERE "isActiveFree" = true AND "deletedAt" IS NULL;

-- Foreign keys
ALTER TABLE "BillingAccount" ADD CONSTRAINT "BillingAccount_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingAccount" ADD CONSTRAINT "BillingAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingAccount" ADD CONSTRAINT "BillingAccount_billingCustomerId_fkey" FOREIGN KEY ("billingCustomerId") REFERENCES "BillingCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BillingCustomer" ADD CONSTRAINT "BillingCustomer_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageEvent" ADD CONSTRAINT "UsageEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UsagePeriodAggregate" ADD CONSTRAINT "UsagePeriodAggregate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
