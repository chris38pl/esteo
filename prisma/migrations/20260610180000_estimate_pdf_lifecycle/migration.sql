-- CreateEnum
CREATE TYPE "EstimatePdfStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "EstimatePdf" ADD COLUMN "storageCustomId" TEXT,
ADD COLUMN "status" "EstimatePdfStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "errorMessage" TEXT,
ALTER COLUMN "fileKey" DROP NOT NULL;

-- Backfill: logical storage paths (pre-fix) need regeneration
UPDATE "EstimatePdf"
SET "status" = 'PENDING'
WHERE "fileKey" LIKE '%/pdfs/%/original.pdf';

-- Backfill: valid UploadThing keys are ready
UPDATE "EstimatePdf"
SET "status" = 'READY'
WHERE "fileKey" IS NOT NULL
  AND "fileKey" NOT LIKE '%/pdfs/%/original.pdf';
