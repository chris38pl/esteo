-- CreateEnum
CREATE TYPE "AttachmentThumbnailStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'PROCESSING', 'GENERATED', 'FAILED');

-- AlterTable
ALTER TABLE "EstimateAttachment" ADD COLUMN "thumbnailStatus" "AttachmentThumbnailStatus" NOT NULL DEFAULT 'NOT_APPLICABLE';
ALTER TABLE "EstimateAttachment" ADD COLUMN "thumbnailGenerationError" TEXT;

-- Backfill thumbnailStatus from existing data
UPDATE "EstimateAttachment"
SET "thumbnailStatus" = 'NOT_APPLICABLE'
WHERE "attachmentType" != 'IMAGE';

UPDATE "EstimateAttachment"
SET "thumbnailStatus" = 'GENERATED'
WHERE "attachmentType" = 'IMAGE' AND "thumbnailStorageKey" IS NOT NULL;

UPDATE "EstimateAttachment"
SET "thumbnailStatus" = 'PENDING'
WHERE "attachmentType" = 'IMAGE' AND "thumbnailStorageKey" IS NULL;
