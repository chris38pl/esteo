-- CreateEnum
CREATE TYPE "RequestStagingAttachmentStatus" AS ENUM ('UPLOADING', 'PENDING', 'FAILED', 'LINKED');

-- CreateTable
CREATE TABLE "RequestStagingAttachment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" "RequestStagingAttachmentStatus" NOT NULL DEFAULT 'UPLOADING',
    "uploadSource" "AttachmentUploadSource" NOT NULL,
    "uploadedById" TEXT,
    "publicFingerprint" TEXT,
    "estimateRequestId" TEXT,
    "linkedAt" TIMESTAMP(3),
    "attachmentType" "AttachmentType",
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" BIGINT NOT NULL DEFAULT 0,
    "storageKey" TEXT,
    "storageProvider" "StorageProvider" NOT NULL DEFAULT 'UPLOADTHING',
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestStagingAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestStagingAttachment_workspaceId_status_idx" ON "RequestStagingAttachment"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "RequestStagingAttachment_status_createdAt_idx" ON "RequestStagingAttachment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RequestStagingAttachment_status_updatedAt_idx" ON "RequestStagingAttachment"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "RequestStagingAttachment_workspaceId_publicFingerprint_stat_idx" ON "RequestStagingAttachment"("workspaceId", "publicFingerprint", "status");

-- CreateIndex
CREATE INDEX "RequestStagingAttachment_workspaceId_uploadedById_status_idx" ON "RequestStagingAttachment"("workspaceId", "uploadedById", "status");

-- CreateIndex
CREATE INDEX "RequestStagingAttachment_estimateRequestId_idx" ON "RequestStagingAttachment"("estimateRequestId");

-- AddForeignKey
ALTER TABLE "RequestStagingAttachment" ADD CONSTRAINT "RequestStagingAttachment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStagingAttachment" ADD CONSTRAINT "RequestStagingAttachment_estimateRequestId_fkey" FOREIGN KEY ("estimateRequestId") REFERENCES "EstimateRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStagingAttachment" ADD CONSTRAINT "RequestStagingAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
