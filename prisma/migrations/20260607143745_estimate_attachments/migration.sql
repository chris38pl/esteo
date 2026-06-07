-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('UPLOADTHING');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'PDF');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "attachmentStorageLimitBytes" BIGINT NOT NULL DEFAULT 262144000,
ADD COLUMN     "attachmentStorageUsedBytes" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "EstimateAttachment" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "attachmentType" "AttachmentType" NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageProvider" "StorageProvider" NOT NULL DEFAULT 'UPLOADTHING',
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "thumbnailStorageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimateAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstimateAttachment_estimateId_createdAt_idx" ON "EstimateAttachment"("estimateId", "createdAt");

-- CreateIndex
CREATE INDEX "EstimateAttachment_workspaceId_idx" ON "EstimateAttachment"("workspaceId");

-- AddForeignKey
ALTER TABLE "EstimateAttachment" ADD CONSTRAINT "EstimateAttachment_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateAttachment" ADD CONSTRAINT "EstimateAttachment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateAttachment" ADD CONSTRAINT "EstimateAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
