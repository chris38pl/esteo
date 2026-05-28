-- Workspace billing architecture migration with data backfill

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('NONE', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'CANCELED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WorkspaceRuleType" AS ENUM ('ESTIMATE', 'COMMUNICATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WorkspaceLocale" AS ENUM ('PL', 'EN');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "platformRole" "PlatformRole" NOT NULL DEFAULT 'NONE';

-- CreateTable BillingAccount
CREATE TABLE "BillingAccount" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable Subscription
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable WorkspaceSettings
CREATE TABLE "WorkspaceSettings" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "branding" JSONB,
    "aiInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable WorkspaceRule
CREATE TABLE "WorkspaceRule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "WorkspaceRuleType" NOT NULL,
    "locale" "WorkspaceLocale",
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable WorkspaceInvitation
CREATE TABLE "WorkspaceInvitation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "WorkspaceRole" NOT NULL,
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable BillingAccountUsagePeriod
CREATE TABLE "BillingAccountUsagePeriod" (
    "id" TEXT NOT NULL,
    "billingAccountId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "estimatesCreated" INTEGER NOT NULL DEFAULT 0,
    "aiAssistantCalls" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingAccountUsagePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable StripeWebhookEvent
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- Workspace: add nullable columns before backfill
ALTER TABLE "Workspace" ADD COLUMN "billingAccountId" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "industry" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "name" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "defaultLocale_new" "WorkspaceLocale" NOT NULL DEFAULT 'PL';

-- Migrate defaultLocale from text to enum
UPDATE "Workspace"
SET "defaultLocale_new" = CASE
  WHEN LOWER("defaultLocale") = 'en' THEN 'EN'::"WorkspaceLocale"
  ELSE 'PL'::"WorkspaceLocale"
END;

ALTER TABLE "Workspace" DROP COLUMN "defaultLocale";
ALTER TABLE "Workspace" RENAME COLUMN "defaultLocale_new" TO "defaultLocale";

-- AlterTable WorkspaceMember
ALTER TABLE "WorkspaceMember" ADD COLUMN IF NOT EXISTS "invitedById" TEXT;

-- Backfill billing accounts and subscriptions for existing users
INSERT INTO "BillingAccount" ("id", "ownerUserId", "createdAt", "updatedAt")
SELECT
  'ba_' || "id",
  "id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User";

INSERT INTO "Subscription" ("id", "billingAccountId", "plan", "status", "createdAt", "updatedAt")
SELECT
  'sub_' || ba."id",
  ba."id",
  CASE
    WHEN LOWER(COALESCE(w."plan", 'free')) = 'pro' THEN 'PRO'::"SubscriptionPlan"
    WHEN LOWER(COALESCE(w."plan", 'free')) = 'business' THEN 'BUSINESS'::"SubscriptionPlan"
    ELSE 'FREE'::"SubscriptionPlan"
  END,
  'ACTIVE'::"SubscriptionStatus",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "BillingAccount" ba
LEFT JOIN LATERAL (
  SELECT w2."plan"
  FROM "Workspace" w2
  WHERE w2."ownerId" = ba."ownerUserId" AND w2."deletedAt" IS NULL
  ORDER BY w2."createdAt" ASC
  LIMIT 1
) w ON true;

-- Backfill workspace name, billingAccountId, normalize slug
UPDATE "Workspace" w
SET
  "name" = COALESCE(NULLIF(w."name", ''), INITCAP(REPLACE(w."slug", '-', ' '))),
  "billingAccountId" = ba."id",
  "slug" = LOWER(w."slug")
FROM "BillingAccount" ba
WHERE ba."ownerUserId" = w."ownerId";

UPDATE "Workspace"
SET "name" = "slug"
WHERE "name" IS NULL OR "name" = '';

-- Migrate branding to WorkspaceSettings
INSERT INTO "WorkspaceSettings" ("id", "workspaceId", "branding", "createdAt", "updatedAt")
SELECT
  'ws_' || w."id",
  w."id",
  w."branding",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Workspace" w
WHERE w."branding" IS NOT NULL;

-- Ensure OWNER membership for each workspace owner
INSERT INTO "WorkspaceMember" ("id", "workspaceId", "userId", "role", "createdAt", "updatedAt")
SELECT
  'wm_owner_' || w."id",
  w."id",
  w."ownerId",
  'OWNER'::"WorkspaceRole",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Workspace" w
WHERE NOT EXISTS (
  SELECT 1 FROM "WorkspaceMember" wm
  WHERE wm."workspaceId" = w."id" AND wm."userId" = w."ownerId"
);

-- Update existing owner memberships to OWNER role
UPDATE "WorkspaceMember" wm
SET "role" = 'OWNER'::"WorkspaceRole"
FROM "Workspace" w
WHERE wm."workspaceId" = w."id" AND wm."userId" = w."ownerId" AND wm."role" != 'OWNER'::"WorkspaceRole";

-- Drop legacy workspace columns
ALTER TABLE "Workspace" DROP COLUMN "branding";
ALTER TABLE "Workspace" DROP COLUMN "plan";

-- Enforce NOT NULL on required workspace columns
ALTER TABLE "Workspace" ALTER COLUMN "billingAccountId" SET NOT NULL;
ALTER TABLE "Workspace" ALTER COLUMN "name" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BillingAccount_ownerUserId_key" ON "BillingAccount"("ownerUserId");
CREATE UNIQUE INDEX "BillingAccount_stripeCustomerId_key" ON "BillingAccount"("stripeCustomerId");
CREATE UNIQUE INDEX "Subscription_billingAccountId_key" ON "Subscription"("billingAccountId");
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE UNIQUE INDEX "WorkspaceSettings_workspaceId_key" ON "WorkspaceSettings"("workspaceId");
CREATE INDEX "WorkspaceRule_workspaceId_active_sortOrder_idx" ON "WorkspaceRule"("workspaceId", "active", "sortOrder");
CREATE UNIQUE INDEX "WorkspaceInvitation_token_key" ON "WorkspaceInvitation"("token");
CREATE INDEX "WorkspaceInvitation_workspaceId_email_status_idx" ON "WorkspaceInvitation"("workspaceId", "email", "status");
CREATE UNIQUE INDEX "BillingAccountUsagePeriod_billingAccountId_periodKey_key" ON "BillingAccountUsagePeriod"("billingAccountId", "periodKey");
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent"("stripeEventId");
CREATE INDEX "Workspace_billingAccountId_idx" ON "Workspace"("billingAccountId");
CREATE INDEX "Workspace_deletedAt_idx" ON "Workspace"("deletedAt");

-- AddForeignKey
ALTER TABLE "BillingAccount" ADD CONSTRAINT "BillingAccount_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "BillingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "BillingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspaceSettings" ADD CONSTRAINT "WorkspaceSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceRule" ADD CONSTRAINT "WorkspaceRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceInvitation" ADD CONSTRAINT "WorkspaceInvitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceInvitation" ADD CONSTRAINT "WorkspaceInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingAccountUsagePeriod" ADD CONSTRAINT "BillingAccountUsagePeriod_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "BillingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
