-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EstimateLineItem" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EstimateRequest" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EstimateSection" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkspaceMember" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "EstimateRequest_workspaceId_deletedAt_idx" ON "EstimateRequest"("workspaceId", "deletedAt");

-- CreateIndex
CREATE INDEX "EstimateSection_workspaceId_deletedAt_idx" ON "EstimateSection"("workspaceId", "deletedAt");
