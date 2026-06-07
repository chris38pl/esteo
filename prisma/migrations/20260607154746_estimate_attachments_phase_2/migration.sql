-- CreateEnum
CREATE TYPE "AttachmentUploadSource" AS ENUM ('EDITOR', 'PUBLIC_REQUEST', 'INTERNAL_REQUEST');

-- AlterEnum
ALTER TYPE "AttachmentType" ADD VALUE 'DOCX';

-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "attachmentCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EstimateAttachment" ADD COLUMN     "uploadSource" "AttachmentUploadSource" NOT NULL DEFAULT 'EDITOR',
ALTER COLUMN "uploadedById" DROP NOT NULL;
