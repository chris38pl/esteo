-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE 'DECLINED';

-- AlterTable
ALTER TABLE "WorkspaceInvitation" ADD COLUMN "promptDismissedAt" TIMESTAMP(3);
