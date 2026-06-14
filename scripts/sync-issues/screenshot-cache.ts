import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { IssueAttachment } from "@prisma/client";

import { extensionForMime } from "./generate-issue-markdown";

export type ScreenshotCacheEntry = {
  id: string;
  storageKey: string;
  updatedAt: string;
  localFile: string;
};

export type SyncContextFile = {
  screenshots?: ScreenshotCacheEntry[];
};

export async function readExistingContext(
  folderPath: string,
): Promise<SyncContextFile | null> {
  const contextPath = path.join(folderPath, "context.json");

  if (!existsSync(contextPath)) {
    return null;
  }

  try {
    const raw = await readFile(contextPath, "utf8");
    return JSON.parse(raw) as SyncContextFile;
  } catch {
    return null;
  }
}

export function shouldSkipScreenshotDownload(input: {
  folderPath: string;
  attachment: IssueAttachment;
  localFile: string;
  existing?: ScreenshotCacheEntry;
}): boolean {
  if (!input.existing) {
    return false;
  }

  if (
    input.existing.id !== input.attachment.id ||
    input.existing.storageKey !== input.attachment.storageKey ||
    input.existing.updatedAt !== input.attachment.createdAt.toISOString()
  ) {
    return false;
  }

  return existsSync(path.join(input.folderPath, input.localFile));
}

export function buildScreenshotLocalFile(index: number, mimeType: string): string {
  return `screenshot-${index + 1}.${extensionForMime(mimeType)}`;
}
