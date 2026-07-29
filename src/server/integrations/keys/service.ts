import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { WorkspaceApiKey, WorkspaceApiKeyMode } from "@prisma/client";

import { prisma } from "@/db/client";
import { DEFAULT_API_KEY_SCOPES } from "@/server/integrations/version";

const SECRET_BYTES = 24;

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function modePrefix(mode: WorkspaceApiKeyMode): string {
  return mode === "LIVE" ? "est_live_" : "est_test_";
}

function buildPlaintext(mode: WorkspaceApiKeyMode): {
  plaintext: string;
  keyPrefix: string;
  keyHash: string;
} {
  const secret = randomBytes(SECRET_BYTES).toString("base64url");
  const plaintext = `${modePrefix(mode)}${secret}`;
  const keyPrefix = `${modePrefix(mode)}…${secret.slice(-4)}`;
  return { plaintext, keyPrefix, keyHash: hashSecret(plaintext) };
}

export function hashApiKeyPlaintext(plaintext: string): string {
  return hashSecret(plaintext);
}

export function safeEqualApiKey(plaintext: string, keyHash: string): boolean {
  const computed = Buffer.from(hashSecret(plaintext), "utf8");
  const stored = Buffer.from(keyHash, "utf8");
  if (computed.length !== stored.length) {
    return false;
  }
  return timingSafeEqual(computed, stored);
}

export type ApiKeyListItem = {
  id: string;
  name: string;
  mode: WorkspaceApiKeyMode;
  keyPrefix: string;
  scopes: string[];
  allowedOrigins: string[];
  allowedIps: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

function toListItem(row: WorkspaceApiKey): ApiKeyListItem {
  return {
    id: row.id,
    name: row.name,
    mode: row.mode,
    keyPrefix: row.keyPrefix,
    scopes: row.scopes,
    allowedOrigins: row.allowedOrigins,
    allowedIps: row.allowedIps,
    rateLimitPerMinute: row.rateLimitPerMinute,
    rateLimitPerDay: row.rateLimitPerDay,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listWorkspaceApiKeys(workspaceId: string): Promise<ApiKeyListItem[]> {
  const rows = await prisma.workspaceApiKey.findMany({
    where: { workspaceId },
    orderBy: [{ revokedAt: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toListItem);
}

export type CreateApiKeyInput = {
  workspaceId: string;
  createdByUserId: string;
  name: string;
  mode: WorkspaceApiKeyMode;
  allowedOrigins?: string[];
  allowedIps?: string[];
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
  scopes?: string[];
};

export async function createWorkspaceApiKey(
  input: CreateApiKeyInput,
): Promise<{ key: ApiKeyListItem; plaintext: string }> {
  const { plaintext, keyPrefix, keyHash } = buildPlaintext(input.mode);

  const row = await prisma.workspaceApiKey.create({
    data: {
      workspaceId: input.workspaceId,
      createdByUserId: input.createdByUserId,
      name: input.name.trim(),
      mode: input.mode,
      keyPrefix,
      keyHash,
      scopes: input.scopes?.length ? input.scopes : [...DEFAULT_API_KEY_SCOPES],
      allowedOrigins: normalizeOrigins(input.allowedOrigins ?? []),
      allowedIps: normalizeIps(input.allowedIps ?? []),
      rateLimitPerMinute: input.rateLimitPerMinute ?? 100,
      rateLimitPerDay: input.rateLimitPerDay ?? 1000,
    },
  });

  return { key: toListItem(row), plaintext };
}

export async function regenerateWorkspaceApiKey(input: {
  workspaceId: string;
  keyId: string;
}): Promise<{ key: ApiKeyListItem; plaintext: string } | null> {
  const existing = await prisma.workspaceApiKey.findFirst({
    where: { id: input.keyId, workspaceId: input.workspaceId, revokedAt: null },
  });

  if (!existing) {
    return null;
  }

  const { plaintext, keyPrefix, keyHash } = buildPlaintext(existing.mode);

  const row = await prisma.workspaceApiKey.update({
    where: { id: existing.id },
    data: { keyPrefix, keyHash },
  });

  return { key: toListItem(row), plaintext };
}

export async function revokeWorkspaceApiKey(input: {
  workspaceId: string;
  keyId: string;
}): Promise<ApiKeyListItem | null> {
  const existing = await prisma.workspaceApiKey.findFirst({
    where: { id: input.keyId, workspaceId: input.workspaceId, revokedAt: null },
  });

  if (!existing) {
    return null;
  }

  const row = await prisma.workspaceApiKey.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return toListItem(row);
}

export async function updateWorkspaceApiKey(input: {
  workspaceId: string;
  keyId: string;
  name?: string;
  allowedOrigins?: string[];
  allowedIps?: string[];
  rateLimitPerMinute?: number;
  rateLimitPerDay?: number;
}): Promise<ApiKeyListItem | null> {
  const existing = await prisma.workspaceApiKey.findFirst({
    where: { id: input.keyId, workspaceId: input.workspaceId, revokedAt: null },
  });

  if (!existing) {
    return null;
  }

  const row = await prisma.workspaceApiKey.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.allowedOrigins !== undefined
        ? { allowedOrigins: normalizeOrigins(input.allowedOrigins) }
        : {}),
      ...(input.allowedIps !== undefined ? { allowedIps: normalizeIps(input.allowedIps) } : {}),
      ...(input.rateLimitPerMinute !== undefined
        ? { rateLimitPerMinute: input.rateLimitPerMinute }
        : {}),
      ...(input.rateLimitPerDay !== undefined ? { rateLimitPerDay: input.rateLimitPerDay } : {}),
    },
  });

  return toListItem(row);
}

export async function findActiveApiKeyByPlaintext(plaintext: string) {
  if (!plaintext.startsWith("est_live_") && !plaintext.startsWith("est_test_")) {
    return null;
  }

  const keyHash = hashSecret(plaintext);
  const row = await prisma.workspaceApiKey.findFirst({
    where: { keyHash, revokedAt: null },
    include: {
      workspace: {
        select: { id: true, slug: true, industry: true, deletedAt: true },
      },
    },
  });

  if (!row || row.workspace.deletedAt) {
    return null;
  }

  if (!safeEqualApiKey(plaintext, row.keyHash)) {
    return null;
  }

  return row;
}

export async function touchApiKeyLastUsed(keyId: string): Promise<void> {
  await prisma.workspaceApiKey.update({
    where: { id: keyId },
    data: { lastUsedAt: new Date() },
  });
}

function normalizeOrigins(origins: string[]): string[] {
  return [
    ...new Set(
      origins
        .map((origin) => origin.trim().replace(/\/$/, ""))
        .filter((origin) => origin.length > 0),
    ),
  ];
}

function normalizeIps(ips: string[]): string[] {
  return [
    ...new Set(
      ips
        .map((ip) => ip.trim())
        .filter((ip) => ip.length > 0),
    ),
  ];
}
