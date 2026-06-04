-- CreateEnum
CREATE TYPE "EstimateAiMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "EstimateAiMessage" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "role" "EstimateAiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "proposalJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateAiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstimateAiMessage_versionId_createdAt_idx" ON "EstimateAiMessage"("versionId", "createdAt");

-- AddForeignKey
ALTER TABLE "EstimateAiMessage" ADD CONSTRAINT "EstimateAiMessage_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "EstimateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
