/*
  Warnings:

  - You are about to drop the column `estimateId` on the `EstimateSection` table. All the data in the column will be lost.
  - Added the required column `versionId` to the `EstimateSection` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstimateVersionStatus" AS ENUM ('DRAFT', 'SENT', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "EstimateSection" DROP CONSTRAINT "EstimateSection_estimateId_fkey";

-- DropIndex
DROP INDEX "EstimateSection_estimateId_sortOrder_idx";

-- DropIndex
DROP INDEX "EstimateSection_workspaceId_deletedAt_idx";

-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "latestVersionId" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "EstimateSection" DROP COLUMN "estimateId",
ADD COLUMN     "versionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "EstimateVersion" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "EstimateVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "marginPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateRevision" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstimateVersion_estimateId_idx" ON "EstimateVersion"("estimateId");

-- CreateIndex
CREATE INDEX "EstimateVersion_workspaceId_idx" ON "EstimateVersion"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "EstimateVersion_estimateId_versionNumber_key" ON "EstimateVersion"("estimateId", "versionNumber");

-- CreateIndex
CREATE INDEX "EstimateRevision_versionId_createdAt_idx" ON "EstimateRevision"("versionId", "createdAt");

-- CreateIndex
CREATE INDEX "EstimateRevision_workspaceId_idx" ON "EstimateRevision"("workspaceId");

-- CreateIndex
CREATE INDEX "EstimateSection_versionId_sortOrder_idx" ON "EstimateSection"("versionId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_latestVersionId_fkey" FOREIGN KEY ("latestVersionId") REFERENCES "EstimateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateVersion" ADD CONSTRAINT "EstimateVersion_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateVersion" ADD CONSTRAINT "EstimateVersion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateSection" ADD CONSTRAINT "EstimateSection_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "EstimateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateRevision" ADD CONSTRAINT "EstimateRevision_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "EstimateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateRevision" ADD CONSTRAINT "EstimateRevision_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
