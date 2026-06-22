-- CreateTable
CREATE TABLE "IssueStagingAttachment" (
    "id" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "status" "RequestStagingAttachmentStatus" NOT NULL DEFAULT 'UPLOADING',
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" BIGINT NOT NULL DEFAULT 0,
    "storageKey" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueStagingAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueStagingAttachment_uploadedById_status_createdAt_idx" ON "IssueStagingAttachment"("uploadedById", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "IssueStagingAttachment" ADD CONSTRAINT "IssueStagingAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
