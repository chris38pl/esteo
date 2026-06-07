-- CreateEnum
CREATE TYPE "EstimateActivityCategory" AS ENUM ('ESTIMATE', 'VERSION', 'FINANCIAL', 'AI', 'SHARING');

-- CreateEnum
CREATE TYPE "EstimateActivityActorType" AS ENUM ('USER', 'SYSTEM');

-- CreateTable
CREATE TABLE "EstimateActivityLog" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorType" "EstimateActivityActorType" NOT NULL DEFAULT 'USER',
    "actorUserId" TEXT,
    "category" "EstimateActivityCategory" NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstimateActivityLog_estimateId_occurredAt_idx" ON "EstimateActivityLog"("estimateId", "occurredAt");

-- CreateIndex
CREATE INDEX "EstimateActivityLog_estimateId_action_actorType_actorUserId_idx" ON "EstimateActivityLog"("estimateId", "action", "actorType", "actorUserId", "occurredAt");

-- AddForeignKey
ALTER TABLE "EstimateActivityLog" ADD CONSTRAINT "EstimateActivityLog_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateActivityLog" ADD CONSTRAINT "EstimateActivityLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateActivityLog" ADD CONSTRAINT "EstimateActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
