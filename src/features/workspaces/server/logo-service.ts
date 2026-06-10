import "server-only";

import type { User } from "@prisma/client";
import { randomUUID } from "crypto";
import sharp from "sharp";

import { getStorageProvider } from "@/features/attachments/server/storage";
import { prisma } from "@/db/client";
import {
  findWorkspaceSettings,
  logAuditEvent,
  updateWorkspaceSettingsRecord,
} from "@/features/workspaces/server/repository";
import {
  MAX_LOGO_DIMENSION_PX,
  MAX_LOGO_RAW_BYTES,
  MAX_LOGO_STORED_BYTES,
  type AllowedLogoMimeType,
  isAllowedLogoMimeType,
} from "@/features/workspaces/lib/logo-constants";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import { requireRole } from "@/server/permissions/require-workspace";

export class WorkspaceLogoError extends Error {
  readonly code: "INVALID_TYPE" | "FILE_TOO_LARGE" | "UPLOAD_FAILED" | "NO_URL";

  constructor(
    message: string,
    code: "INVALID_TYPE" | "FILE_TOO_LARGE" | "UPLOAD_FAILED" | "NO_URL",
  ) {
    super(message);
    this.name = "WorkspaceLogoError";
    this.code = code;
  }
}

export type ProcessedWorkspaceLogo = {
  buffer: Buffer;
  mimeType: AllowedLogoMimeType;
  fileName: string;
};

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function outputFormatForMime(mimeType: AllowedLogoMimeType): "jpeg" | "png" | "webp" {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpeg";
}

function extensionForMime(mimeType: AllowedLogoMimeType): string {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

async function encodeLogoImage(
  pipeline: sharp.Sharp,
  mimeType: AllowedLogoMimeType,
  quality: number,
): Promise<Buffer> {
  const format = outputFormatForMime(mimeType);

  if (format === "jpeg") {
    return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
  }

  if (format === "webp") {
    return pipeline.webp({ quality }).toBuffer();
  }

  return pipeline.png({ compressionLevel: 8 }).toBuffer();
}

export async function processWorkspaceLogo(
  buffer: Buffer,
  mimeType: AllowedLogoMimeType,
  originalFileName: string,
): Promise<ProcessedWorkspaceLogo> {
  let quality = 82;
  let pipeline = sharp(buffer).resize({
    width: MAX_LOGO_DIMENSION_PX,
    height: MAX_LOGO_DIMENSION_PX,
    fit: "inside",
    withoutEnlargement: true,
  });

  let encoded = await encodeLogoImage(pipeline, mimeType, quality);

  if (
    encoded.length > MAX_LOGO_STORED_BYTES &&
    (mimeType === "image/jpeg" || mimeType === "image/webp")
  ) {
    for (const nextQuality of [75, 65]) {
      quality = nextQuality;
      pipeline = sharp(buffer).resize({
        width: MAX_LOGO_DIMENSION_PX,
        height: MAX_LOGO_DIMENSION_PX,
        fit: "inside",
        withoutEnlargement: true,
      });
      encoded = await encodeLogoImage(pipeline, mimeType, quality);

      if (encoded.length <= MAX_LOGO_STORED_BYTES) {
        break;
      }
    }
  }

  const ext = extensionForMime(mimeType);
  const baseName = sanitizeFileName(originalFileName.replace(/\.[^.]+$/, "") || "logo");

  return {
    buffer: encoded,
    mimeType,
    fileName: `${baseName}.${ext}`,
  };
}

export function buildWorkspaceLogoStorageKey(
  workspaceId: string,
  fileId: string,
  fileName: string,
): string {
  return `${workspaceId}/branding/logo/${fileId}/original-${sanitizeFileName(fileName)}`;
}

function parseCurrentBranding(settings: Awaited<ReturnType<typeof findWorkspaceSettings>>) {
  const result = workspaceBrandingSchema.safeParse(settings?.branding ?? {});
  return result.success ? result.data : {};
}

async function mergeAndSaveBranding(
  workspaceId: string,
  logoFields: { logoStorageKey: string; logoUrl: string } | null,
) {
  const existingSettings = await findWorkspaceSettings(workspaceId);
  const current = parseCurrentBranding(existingSettings);

  const nextBranding =
    logoFields === null
      ? workspaceBrandingSchema.parse({
          ...current,
          logoStorageKey: undefined,
          logoUrl: undefined,
        })
      : workspaceBrandingSchema.parse({
          ...current,
          logoStorageKey: logoFields.logoStorageKey,
          logoUrl: logoFields.logoUrl,
        });

  const cleaned = { ...nextBranding };
  if (logoFields === null) {
    delete cleaned.logoStorageKey;
    delete cleaned.logoUrl;
  }

  return updateWorkspaceSettingsRecord(workspaceId, { branding: cleaned });
}

async function deleteLogoFromStorage(storageKey: string | undefined) {
  if (!storageKey) {
    return;
  }

  try {
    await getStorageProvider().delete([storageKey]);
  } catch (error) {
    console.error("[workspace-logo] failed to delete storage key:", storageKey, error);
  }
}

export async function uploadWorkspaceLogo(
  user: User,
  workspaceId: string,
  file: File,
): Promise<{ logoUrl: string; logoStorageKey: string }> {
  await requireRole(user, workspaceId, "OWNER");

  if (file.size > MAX_LOGO_RAW_BYTES) {
    throw new WorkspaceLogoError("File is too large.", "FILE_TOO_LARGE");
  }

  if (!isAllowedLogoMimeType(file.type)) {
    throw new WorkspaceLogoError("Unsupported file type.", "INVALID_TYPE");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await processWorkspaceLogo(buffer, file.type, file.name);

  const fileId = randomUUID();
  const logicalKey = buildWorkspaceLogoStorageKey(
    workspaceId,
    fileId,
    processed.fileName,
  );

  const storage = getStorageProvider();
  const uploadResult = await storage.upload({
    key: logicalKey,
    customId: fileId,
    body: processed.buffer,
    mimeType: processed.mimeType,
    fileName: processed.fileName,
  });

  if (!uploadResult.url) {
    await deleteLogoFromStorage(uploadResult.key);
    throw new WorkspaceLogoError(
      "Upload succeeded but no public URL was returned.",
      "NO_URL",
    );
  }

  const existingSettings = await findWorkspaceSettings(workspaceId);
  const current = parseCurrentBranding(existingSettings);
  const previousStorageKey = current.logoStorageKey;

  const settings = await mergeAndSaveBranding(workspaceId, {
    logoStorageKey: uploadResult.key,
    logoUrl: uploadResult.url,
  });

  await deleteLogoFromStorage(previousStorageKey);

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceSettings",
    entityId: settings.id,
    action: "logo_updated",
  });

  return {
    logoUrl: uploadResult.url,
    logoStorageKey: uploadResult.key,
  };
}

export async function removeWorkspaceLogo(user: User, workspaceId: string) {
  await requireRole(user, workspaceId, "OWNER");

  const existingSettings = await findWorkspaceSettings(workspaceId);
  const current = parseCurrentBranding(existingSettings);
  const storageKey = current.logoStorageKey;

  if (!storageKey && !current.logoUrl) {
    return;
  }

  await deleteLogoFromStorage(storageKey);

  const settings = await mergeAndSaveBranding(workspaceId, null);

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceSettings",
    entityId: settings.id,
    action: "logo_removed",
  });
}

export async function cleanupWorkspaceLogoStorage(workspaceId: string) {
  const existingSettings = await findWorkspaceSettings(workspaceId);
  const current = parseCurrentBranding(existingSettings);
  const storageKey = current.logoStorageKey;

  if (!storageKey && !current.logoUrl) {
    return;
  }

  await deleteLogoFromStorage(storageKey);
  await mergeAndSaveBranding(workspaceId, null);
}

export function parseLogoUrlFromBranding(branding: unknown): string | null {
  const result = workspaceBrandingSchema.safeParse(branding ?? {});
  return result.success && result.data.logoUrl ? result.data.logoUrl : null;
}

export async function getWorkspaceLogoUrlsByIds(
  workspaceIds: string[],
): Promise<Map<string, string>> {
  if (workspaceIds.length === 0) {
    return new Map();
  }

  const settingsRows = await prisma.workspaceSettings.findMany({
    where: { workspaceId: { in: workspaceIds } },
    select: { workspaceId: true, branding: true },
  });

  const map = new Map<string, string>();

  for (const row of settingsRows) {
    const logoUrl = parseLogoUrlFromBranding(row.branding);
    if (logoUrl) {
      map.set(row.workspaceId, logoUrl);
    }
  }

  return map;
}
