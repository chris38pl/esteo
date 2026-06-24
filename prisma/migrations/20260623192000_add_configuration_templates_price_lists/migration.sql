-- AlterTable
ALTER TABLE "WorkspaceSettings"
ADD COLUMN "defaultEstimateTemplateId" TEXT,
ADD COLUMN "defaultPriceListId" TEXT;

-- CreateTable
CREATE TABLE "EstimateTemplate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateTemplateSection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "guidance" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimateTemplateSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateTemplateItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "guidance" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimateTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceListItem" (
    "id" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,4),
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceSettings_defaultEstimateTemplateId_idx" ON "WorkspaceSettings"("defaultEstimateTemplateId");

-- CreateIndex
CREATE INDEX "WorkspaceSettings_defaultPriceListId_idx" ON "WorkspaceSettings"("defaultPriceListId");

-- CreateIndex
CREATE INDEX "EstimateTemplate_workspaceId_deletedAt_sortOrder_idx" ON "EstimateTemplate"("workspaceId", "deletedAt", "sortOrder");

-- CreateIndex
CREATE INDEX "EstimateTemplateSection_templateId_deletedAt_sortOrder_idx" ON "EstimateTemplateSection"("templateId", "deletedAt", "sortOrder");

-- CreateIndex
CREATE INDEX "EstimateTemplateItem_sectionId_deletedAt_sortOrder_idx" ON "EstimateTemplateItem"("sectionId", "deletedAt", "sortOrder");

-- CreateIndex
CREATE INDEX "PriceList_workspaceId_deletedAt_sortOrder_idx" ON "PriceList"("workspaceId", "deletedAt", "sortOrder");

-- CreateIndex
CREATE INDEX "PriceListItem_priceListId_deletedAt_sortOrder_idx" ON "PriceListItem"("priceListId", "deletedAt", "sortOrder");

-- AddForeignKey
ALTER TABLE "WorkspaceSettings" ADD CONSTRAINT "WorkspaceSettings_defaultEstimateTemplateId_fkey" FOREIGN KEY ("defaultEstimateTemplateId") REFERENCES "EstimateTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceSettings" ADD CONSTRAINT "WorkspaceSettings_defaultPriceListId_fkey" FOREIGN KEY ("defaultPriceListId") REFERENCES "PriceList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateTemplate" ADD CONSTRAINT "EstimateTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateTemplateSection" ADD CONSTRAINT "EstimateTemplateSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EstimateTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateTemplateItem" ADD CONSTRAINT "EstimateTemplateItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "EstimateTemplateSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceListItem" ADD CONSTRAINT "PriceListItem_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
