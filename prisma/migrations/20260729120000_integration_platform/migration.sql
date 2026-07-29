-- CreateEnum
CREATE TYPE "WorkspaceApiKeyMode" AS ENUM ('LIVE', 'TEST');

-- AlterEnum
ALTER TYPE "AttachmentUploadSource" ADD VALUE 'PUBLIC_API';

-- CreateTable
CREATE TABLE "WorkspaceApiKey" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "WorkspaceApiKeyMode" NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "allowedOrigins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 100,
    "rateLimitPerDay" INTEGER NOT NULL DEFAULT 1000,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationRequestLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "httpRequestId" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "errorCode" TEXT,
    "errorSummary" TEXT,
    "estimateRequestId" TEXT,
    "estimateId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationRequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationIdempotencyRecord" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT,
    "responseStatus" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationIdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceApiKey_keyHash_key" ON "WorkspaceApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "WorkspaceApiKey_workspaceId_revokedAt_idx" ON "WorkspaceApiKey"("workspaceId", "revokedAt");

-- CreateIndex
CREATE INDEX "WorkspaceApiKey_workspaceId_mode_idx" ON "WorkspaceApiKey"("workspaceId", "mode");

-- CreateIndex
CREATE INDEX "IntegrationRequestLog_workspaceId_createdAt_idx" ON "IntegrationRequestLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "IntegrationRequestLog_httpRequestId_idx" ON "IntegrationRequestLog"("httpRequestId");

-- CreateIndex
CREATE INDEX "IntegrationRequestLog_correlationId_idx" ON "IntegrationRequestLog"("correlationId");

-- CreateIndex
CREATE INDEX "IntegrationIdempotencyRecord_workspaceId_idx" ON "IntegrationIdempotencyRecord"("workspaceId");

-- CreateIndex
CREATE INDEX "IntegrationIdempotencyRecord_expiresAt_idx" ON "IntegrationIdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationIdempotencyRecord_apiKeyId_key_key" ON "IntegrationIdempotencyRecord"("apiKeyId", "key");

-- AddForeignKey
ALTER TABLE "WorkspaceApiKey" ADD CONSTRAINT "WorkspaceApiKey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceApiKey" ADD CONSTRAINT "WorkspaceApiKey_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationRequestLog" ADD CONSTRAINT "IntegrationRequestLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationRequestLog" ADD CONSTRAINT "IntegrationRequestLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "WorkspaceApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationIdempotencyRecord" ADD CONSTRAINT "IntegrationIdempotencyRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationIdempotencyRecord" ADD CONSTRAINT "IntegrationIdempotencyRecord_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "WorkspaceApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
