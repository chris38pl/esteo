-- CreateEnum
CREATE TYPE "OpsCaseType" AS ENUM ('REFERRAL_REWARD_FAILED');

-- CreateEnum
CREATE TYPE "OpsCaseSource" AS ENUM ('REFERRAL_SERVICE', 'RECONCILIATION_CRON', 'STRIPE_WEBHOOK', 'MANUAL');

-- CreateEnum
CREATE TYPE "OpsCaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'IGNORED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OpsCaseSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
ALTER TYPE "NotificationPreferenceCategory" ADD VALUE 'OPS';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ops_case_opened';

-- CreateTable
CREATE TABLE "OpsCaseNumberCounter" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OpsCaseNumberCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpsCase" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" "OpsCaseType" NOT NULL,
    "source" "OpsCaseSource" NOT NULL,
    "status" "OpsCaseStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "OpsCaseSeverity" NOT NULL DEFAULT 'MEDIUM',
    "dedupeKey" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "affectedUserId" TEXT,
    "actorUserId" TEXT,
    "workspaceId" TEXT,
    "entityKind" TEXT,
    "entityId" TEXT,
    "ownerUserId" TEXT,
    "assignedToUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpsCase_number_key" ON "OpsCase"("number");

-- CreateIndex
CREATE INDEX "OpsCase_status_severity_createdAt_idx" ON "OpsCase"("status", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "OpsCase_fingerprint_status_idx" ON "OpsCase"("fingerprint", "status");

-- CreateIndex
CREATE INDEX "OpsCase_source_status_idx" ON "OpsCase"("source", "status");

-- CreateIndex
CREATE INDEX "OpsCase_status_dueAt_idx" ON "OpsCase"("status", "dueAt");

-- CreateIndex
CREATE INDEX "OpsCase_resolvedAt_idx" ON "OpsCase"("resolvedAt");

-- CreateIndex
CREATE INDEX "OpsCase_assignedToUserId_status_idx" ON "OpsCase"("assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "OpsCase_affectedUserId_idx" ON "OpsCase"("affectedUserId");

-- CreateIndex
CREATE INDEX "OpsCase_type_status_idx" ON "OpsCase"("type", "status");

-- CreateIndex
CREATE INDEX "OpsCase_dedupeKey_status_idx" ON "OpsCase"("dedupeKey", "status");

-- CreateIndex
CREATE INDEX "OpsCase_entityKind_entityId_idx" ON "OpsCase"("entityKind", "entityId");

-- Partial unique: at most one active case per dedupeKey
CREATE UNIQUE INDEX "OpsCase_dedupeKey_active_unique" ON "OpsCase"("dedupeKey") WHERE "status" IN ('OPEN', 'IN_PROGRESS');

-- AddForeignKey
ALTER TABLE "OpsCase" ADD CONSTRAINT "OpsCase_affectedUserId_fkey" FOREIGN KEY ("affectedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsCase" ADD CONSTRAINT "OpsCase_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsCase" ADD CONSTRAINT "OpsCase_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsCase" ADD CONSTRAINT "OpsCase_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsCase" ADD CONSTRAINT "OpsCase_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpsCase" ADD CONSTRAINT "OpsCase_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
