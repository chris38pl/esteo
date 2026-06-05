-- CreateTable
CREATE TABLE "EstimateNote" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstimateNote_estimateId_createdAt_idx" ON "EstimateNote"("estimateId", "createdAt");

-- CreateIndex
CREATE INDEX "EstimateNote_parentId_idx" ON "EstimateNote"("parentId");

-- AddForeignKey
ALTER TABLE "EstimateNote" ADD CONSTRAINT "EstimateNote_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateNote" ADD CONSTRAINT "EstimateNote_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "EstimateNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateNote" ADD CONSTRAINT "EstimateNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
