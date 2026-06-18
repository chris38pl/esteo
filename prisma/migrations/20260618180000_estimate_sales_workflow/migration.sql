-- CreateEnum
CREATE TYPE "EstimateSendTransportStatus" AS ENUM ('QUEUED', 'GENERATING_PDF', 'SENDING', 'PROVIDER_ACCEPTED', 'DELIVERED', 'BOUNCED', 'FAILED');

-- AlterEnum: add new business statuses before removing ARCHIVED
ALTER TYPE "EstimateVersionStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "EstimateVersionStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- AlterTable: new workflow columns on EstimateVersion
ALTER TABLE "EstimateVersion" ADD COLUMN IF NOT EXISTS "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "EstimateVersion" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "EstimateVersion" ADD COLUMN IF NOT EXISTS "lastSentAt" TIMESTAMP(3);
ALTER TABLE "EstimateVersion" ADD COLUMN IF NOT EXISTS "lastSentToEmail" TEXT;
ALTER TABLE "EstimateVersion" ADD COLUMN IF NOT EXISTS "lastSentByUserId" TEXT;
ALTER TABLE "EstimateVersion" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
ALTER TABLE "EstimateVersion" ADD COLUMN IF NOT EXISTS "acceptedByUserId" TEXT;
ALTER TABLE "EstimateVersion" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "EstimateVersion" ADD COLUMN IF NOT EXISTS "rejectedByUserId" TEXT;

-- Migrate ARCHIVED status to archivedAt + DRAFT
UPDATE "EstimateVersion"
SET "archivedAt" = COALESCE("archivedAt", "updatedAt")
WHERE "status"::text = 'ARCHIVED';

UPDATE "EstimateVersion"
SET "status" = 'DRAFT'
WHERE "status"::text = 'ARCHIVED';

-- Backfill statusChangedAt from updatedAt for existing rows
UPDATE "EstimateVersion"
SET "statusChangedAt" = "updatedAt"
WHERE "statusChangedAt" IS NULL;

-- Remove ARCHIVED from EstimateVersionStatus enum
CREATE TYPE "EstimateVersionStatus_new" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');

ALTER TABLE "EstimateVersion"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "EstimateVersion"
  ALTER COLUMN "status" TYPE "EstimateVersionStatus_new"
  USING ("status"::text::"EstimateVersionStatus_new");

ALTER TABLE "EstimateVersion"
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

DROP TYPE "EstimateVersionStatus";

ALTER TYPE "EstimateVersionStatus_new" RENAME TO "EstimateVersionStatus";

-- CreateTable
CREATE TABLE "EstimateVersionSend" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sentToEmail" TEXT NOT NULL,
    "deliveredToEmail" TEXT,
    "replyToEmail" TEXT NOT NULL,
    "sentByUserId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "transportStatus" "EstimateSendTransportStatus" NOT NULL DEFAULT 'QUEUED',
    "errorMessage" TEXT,
    "emailSubject" TEXT NOT NULL,
    "emailHtml" TEXT,
    "attachPdf" BOOLEAN NOT NULL DEFAULT true,
    "estimatePdfId" TEXT,
    "resendMessageId" TEXT,
    "triggerRunId" TEXT,
    "isResend" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateVersionSend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstimateVersionSend_versionId_sentAt_idx" ON "EstimateVersionSend"("versionId", "sentAt" DESC);

-- CreateIndex
CREATE INDEX "EstimateVersionSend_workspaceId_idx" ON "EstimateVersionSend"("workspaceId");

-- CreateIndex
CREATE INDEX "EstimateVersion_archivedAt_idx" ON "EstimateVersion"("workspaceId", "archivedAt");

-- AddForeignKey
ALTER TABLE "EstimateVersion" ADD CONSTRAINT "EstimateVersion_lastSentByUserId_fkey" FOREIGN KEY ("lastSentByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateVersion" ADD CONSTRAINT "EstimateVersion_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateVersion" ADD CONSTRAINT "EstimateVersion_rejectedByUserId_fkey" FOREIGN KEY ("rejectedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateVersionSend" ADD CONSTRAINT "EstimateVersionSend_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "EstimateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateVersionSend" ADD CONSTRAINT "EstimateVersionSend_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateVersionSend" ADD CONSTRAINT "EstimateVersionSend_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateVersionSend" ADD CONSTRAINT "EstimateVersionSend_estimatePdfId_fkey" FOREIGN KEY ("estimatePdfId") REFERENCES "EstimatePdf"("id") ON DELETE SET NULL ON UPDATE CASCADE;
