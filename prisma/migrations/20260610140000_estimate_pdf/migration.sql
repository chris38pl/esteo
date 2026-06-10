-- CreateTable
CREATE TABLE "EstimatePdf" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "EstimatePdf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EstimatePdf_versionId_key" ON "EstimatePdf"("versionId");

-- CreateIndex
CREATE INDEX "EstimatePdf_estimateId_idx" ON "EstimatePdf"("estimateId");

-- AddForeignKey
ALTER TABLE "EstimatePdf" ADD CONSTRAINT "EstimatePdf_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimatePdf" ADD CONSTRAINT "EstimatePdf_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "EstimateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimatePdf" ADD CONSTRAINT "EstimatePdf_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
