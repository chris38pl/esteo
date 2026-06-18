-- CreateEnum
CREATE TYPE "SearchEntityType" AS ENUM ('ESTIMATE', 'INQUIRY', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "SearchIconType" AS ENUM ('ESTIMATE', 'REQUEST', 'FILE');

-- CreateTable
CREATE TABLE "SearchDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "workspaceSlugSnapshot" TEXT,
    "entityType" "SearchEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "iconType" "SearchIconType" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "searchText" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRecentDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityType" "SearchEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "subtitleSnapshot" TEXT,
    "iconTypeSnapshot" "SearchIconType" NOT NULL,
    "lastOpenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRecentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchDocument_workspaceId_deletedAt_idx" ON "SearchDocument"("workspaceId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SearchDocument_workspaceId_entityType_entityId_key" ON "SearchDocument"("workspaceId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "UserRecentDocument_userId_workspaceId_lastOpenedAt_idx" ON "UserRecentDocument"("userId", "workspaceId", "lastOpenedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserRecentDocument_userId_workspaceId_entityType_entityId_key" ON "UserRecentDocument"("userId", "workspaceId", "entityType", "entityId");

-- AddForeignKey
ALTER TABLE "SearchDocument" ADD CONSTRAINT "SearchDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRecentDocument" ADD CONSTRAINT "UserRecentDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRecentDocument" ADD CONSTRAINT "UserRecentDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
