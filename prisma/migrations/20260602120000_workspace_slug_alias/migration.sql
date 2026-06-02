-- CreateTable
CREATE TABLE "WorkspaceSlugAlias" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceSlugAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceSlugAlias_slug_key" ON "WorkspaceSlugAlias"("slug");

-- CreateIndex
CREATE INDEX "WorkspaceSlugAlias_workspaceId_idx" ON "WorkspaceSlugAlias"("workspaceId");

-- AddForeignKey
ALTER TABLE "WorkspaceSlugAlias" ADD CONSTRAINT "WorkspaceSlugAlias_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
