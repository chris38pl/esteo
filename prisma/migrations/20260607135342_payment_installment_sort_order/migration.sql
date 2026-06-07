-- DropIndex
DROP INDEX "PaymentInstallment_estimateId_dueDate_idx";

-- AlterTable
ALTER TABLE "PaymentInstallment" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill sort order from existing due date / created at ordering
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "estimateId"
      ORDER BY "dueDate" ASC NULLS LAST, "createdAt" ASC
    ) - 1 AS rn
  FROM "PaymentInstallment"
)
UPDATE "PaymentInstallment" pi
SET "sortOrder" = ranked.rn
FROM ranked
WHERE pi.id = ranked.id;

-- CreateIndex
CREATE INDEX "PaymentInstallment_estimateId_sortOrder_idx" ON "PaymentInstallment"("estimateId", "sortOrder");
