-- CreateTable
CREATE TABLE "PinnedEstimate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PinnedEstimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PinnedEstimate_userId_workspaceId_estimateId_key" ON "PinnedEstimate"("userId", "workspaceId", "estimateId");

-- CreateIndex
CREATE INDEX "PinnedEstimate_userId_workspaceId_sortOrder_idx" ON "PinnedEstimate"("userId", "workspaceId", "sortOrder");

-- AddForeignKey
ALTER TABLE "PinnedEstimate" ADD CONSTRAINT "PinnedEstimate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinnedEstimate" ADD CONSTRAINT "PinnedEstimate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinnedEstimate" ADD CONSTRAINT "PinnedEstimate_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
