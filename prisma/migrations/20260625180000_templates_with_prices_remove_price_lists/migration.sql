-- CreateEnum
CREATE TYPE "EstimateTemplateGenerationMode" AS ENUM ('CONSERVATIVE', 'SMART');

-- AlterTable
ALTER TABLE "EstimateTemplate"
ADD COLUMN "generationMode" "EstimateTemplateGenerationMode" NOT NULL DEFAULT 'SMART',
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'PLN';

-- AlterTable
ALTER TABLE "EstimateTemplateItem"
ADD COLUMN "unitPrice" DECIMAL(12,2),
ADD COLUMN "vatRate" DECIMAL(5,4),
ADD COLUMN "note" TEXT;

-- Drop price list defaults and tables
ALTER TABLE "WorkspaceSettings" DROP CONSTRAINT IF EXISTS "WorkspaceSettings_defaultPriceListId_fkey";
DROP INDEX IF EXISTS "WorkspaceSettings_defaultPriceListId_idx";
ALTER TABLE "WorkspaceSettings" DROP COLUMN IF EXISTS "defaultPriceListId";

DROP TABLE IF EXISTS "PriceListItem";
DROP TABLE IF EXISTS "PriceList";
