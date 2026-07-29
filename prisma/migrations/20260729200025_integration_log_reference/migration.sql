-- AlterTable
ALTER TABLE "IntegrationRequestLog" ADD COLUMN     "reference" JSONB;

-- RenameIndex
ALTER INDEX "IssueActivityLog_issueId_action_actorType_actorUserId_occurredA" RENAME TO "IssueActivityLog_issueId_action_actorType_actorUserId_occur_idx";
