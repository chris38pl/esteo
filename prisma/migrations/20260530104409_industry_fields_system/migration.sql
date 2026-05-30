-- CreateEnum
CREATE TYPE "WorkspaceIndustry" AS ENUM ('CONSTRUCTION', 'ELECTRICAL', 'CARPENTRY', 'PLUMBING', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessDocumentType" AS ENUM ('ESTIMATE_REQUEST', 'ESTIMATE');

-- CreateEnum
CREATE TYPE "IndustryFieldValueType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT');

-- Workspace industry migration: String? -> WorkspaceIndustry + industryOtherText
ALTER TABLE "Workspace" ADD COLUMN "industryOtherText" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "industry_new" "WorkspaceIndustry" NOT NULL DEFAULT 'OTHER';

UPDATE "Workspace"
SET
  "industry_new" = CASE
    WHEN LOWER(TRIM(COALESCE("industry", ''))) IN ('construction', 'general contracting', 'roboty budowlane') THEN 'CONSTRUCTION'::"WorkspaceIndustry"
    WHEN LOWER(TRIM(COALESCE("industry", ''))) IN ('electrical', 'elektryka') THEN 'ELECTRICAL'::"WorkspaceIndustry"
    WHEN LOWER(TRIM(COALESCE("industry", ''))) IN ('carpentry', 'stolarstwo', 'carpenter') THEN 'CARPENTRY'::"WorkspaceIndustry"
    WHEN LOWER(TRIM(COALESCE("industry", ''))) IN ('plumbing', 'hydraulika') THEN 'PLUMBING'::"WorkspaceIndustry"
    ELSE 'OTHER'::"WorkspaceIndustry"
  END,
  "industryOtherText" = CASE
    WHEN LOWER(TRIM(COALESCE("industry", ''))) IN (
      'construction', 'general contracting', 'roboty budowlane',
      'electrical', 'elektryka',
      'carpentry', 'stolarstwo', 'carpenter',
      'plumbing', 'hydraulika'
    ) THEN NULL
    WHEN TRIM(COALESCE("industry", '')) = '' THEN NULL
    ELSE TRIM("industry")
  END;

ALTER TABLE "Workspace" DROP COLUMN "industry";
ALTER TABLE "Workspace" RENAME COLUMN "industry_new" TO "industry";
ALTER TABLE "Workspace" ALTER COLUMN "industry" DROP DEFAULT;

-- CreateTable
CREATE TABLE "IndustryFieldDefinition" (
    "id" TEXT NOT NULL,
    "industry" "WorkspaceIndustry" NOT NULL,
    "documentType" "BusinessDocumentType" NOT NULL,
    "key" TEXT NOT NULL,
    "valueType" "IndustryFieldValueType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryFieldTranslation" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "locale" "WorkspaceLocale" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "placeholder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryFieldTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentFieldValue" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "documentType" "BusinessDocumentType" NOT NULL,
    "documentId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNumber" DECIMAL(18,4),
    "valueDate" DATE,
    "valueBoolean" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndustryFieldDefinition_industry_documentType_active_idx" ON "IndustryFieldDefinition"("industry", "documentType", "active");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryFieldDefinition_industry_documentType_key_key" ON "IndustryFieldDefinition"("industry", "documentType", "key");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryFieldTranslation_fieldId_locale_key" ON "IndustryFieldTranslation"("fieldId", "locale");

-- CreateIndex
CREATE INDEX "DocumentFieldValue_workspaceId_documentType_documentId_idx" ON "DocumentFieldValue"("workspaceId", "documentType", "documentId");

-- CreateIndex
CREATE INDEX "DocumentFieldValue_documentType_fieldKey_valueNumber_idx" ON "DocumentFieldValue"("documentType", "fieldKey", "valueNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFieldValue_documentType_documentId_fieldKey_key" ON "DocumentFieldValue"("documentType", "documentId", "fieldKey");

-- AddForeignKey
ALTER TABLE "IndustryFieldTranslation" ADD CONSTRAINT "IndustryFieldTranslation_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "IndustryFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFieldValue" ADD CONSTRAINT "DocumentFieldValue_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
