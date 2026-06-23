-- CreateEnum
CREATE TYPE "IssueActivityActorType" AS ENUM ('USER', 'CURSOR_AI', 'SYSTEM');

-- CreateTable
CREATE TABLE "IssueComment" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "parentId" TEXT,
    "actorType" "IssueActivityActorType" NOT NULL DEFAULT 'USER',
    "authorUserId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueActivityLog" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "actorType" "IssueActivityActorType" NOT NULL DEFAULT 'USER',
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueComment_issueId_createdAt_idx" ON "IssueComment"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "IssueComment_parentId_idx" ON "IssueComment"("parentId");

-- CreateIndex
CREATE INDEX "IssueComment_actorType_authorUserId_idx" ON "IssueComment"("actorType", "authorUserId");

-- CreateIndex
CREATE INDEX "IssueActivityLog_issueId_occurredAt_idx" ON "IssueActivityLog"("issueId", "occurredAt");

-- CreateIndex
CREATE INDEX "IssueActivityLog_issueId_action_actorType_actorUserId_occurredAt_idx" ON "IssueActivityLog"("issueId", "action", "actorType", "actorUserId", "occurredAt");

-- AddForeignKey
ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "IssueComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueActivityLog" ADD CONSTRAINT "IssueActivityLog_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueActivityLog" ADD CONSTRAINT "IssueActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
