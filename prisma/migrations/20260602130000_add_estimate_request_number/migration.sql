-- AlterTable
ALTER TABLE "EstimateRequest" ADD COLUMN "requestNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EstimateRequest_workspaceId_requestNumber_key" ON "EstimateRequest"("workspaceId", "requestNumber");
