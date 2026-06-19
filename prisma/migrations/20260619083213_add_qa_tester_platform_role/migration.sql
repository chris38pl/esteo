-- AlterEnum
ALTER TYPE "PlatformRole" ADD VALUE 'QA_TESTER';

-- RenameIndex
ALTER INDEX "EstimateVersion_archivedAt_idx" RENAME TO "EstimateVersion_workspaceId_archivedAt_idx";
