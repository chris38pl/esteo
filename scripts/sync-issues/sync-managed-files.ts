import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Issue, IssueAttachment } from "@prisma/client";

import { buildIssueFolderName } from "../../src/features/issues/lib/slugify-issue-title";
import {
  generateIssueContextJson,
  generateIssueMarkdown,
  generateOpenIssuesMarkdown,
} from "./generate-issue-markdown";
import {
  buildScreenshotLocalFile,
  readExistingContext,
  shouldSkipScreenshotDownload,
  type ScreenshotCacheEntry,
} from "./screenshot-cache";

export type IssueSyncComment = {
  id: string;
  parentId: string | null;
  actorType: string;
  body: string;
  createdAt: Date;
  author: {
    name: string | null;
    email: string;
  } | null;
};

export type IssueWithAttachments = Issue & {
  attachments: IssueAttachment[];
  comments: IssueSyncComment[];
};

const MANAGED_FILE_PREFIXES = ["issue.md", "context.json", "screenshot-"];

export async function upsertIssueFolder(input: {
  docsRoot: string;
  issue: IssueWithAttachments;
  downloadFile: (storageKey: string) => Promise<Buffer>;
}): Promise<void> {
  const folderName = buildIssueFolderName(input.issue.number, input.issue.folderSlug);
  const folderPath = path.join(input.docsRoot, folderName);
  await mkdir(folderPath, { recursive: true });

  const existingContext = await readExistingContext(folderPath);
  const screenshotEntries: ScreenshotCacheEntry[] = [];

  for (let index = 0; index < input.issue.attachments.length; index += 1) {
    const attachment = input.issue.attachments[index];
    const localFile = buildScreenshotLocalFile(index, attachment.mimeType);
    const cacheEntry = existingContext?.screenshots?.find(
      (entry) => entry.id === attachment.id && entry.storageKey === attachment.storageKey,
    );

    const skipDownload = shouldSkipScreenshotDownload({
      folderPath,
      attachment,
      localFile,
      existing: cacheEntry,
    });

    if (!skipDownload) {
      const buffer = await input.downloadFile(attachment.storageKey);
      await writeFile(path.join(folderPath, localFile), buffer);
    }

    screenshotEntries.push({
      id: attachment.id,
      storageKey: attachment.storageKey,
      updatedAt: attachment.createdAt.toISOString(),
      localFile,
    });
  }

  await removeStaleScreenshots(folderPath, screenshotEntries.map((entry) => entry.localFile));

  await writeFile(
    path.join(folderPath, "issue.md"),
    generateIssueMarkdown(input.issue),
    "utf8",
  );

  await writeFile(
    path.join(folderPath, "context.json"),
    generateIssueContextJson(input.issue, screenshotEntries),
    "utf8",
  );
}

async function removeStaleScreenshots(folderPath: string, activeFiles: string[]): Promise<void> {
  const entries = await readdir(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.startsWith("screenshot-")) {
      continue;
    }

    if (!activeFiles.includes(entry.name)) {
      await rm(path.join(folderPath, entry.name));
    }
  }
}

export async function removeIssueFolder(docsRoot: string, number: number, folderSlug: string) {
  const folderPath = path.join(docsRoot, buildIssueFolderName(number, folderSlug));
  await rm(folderPath, { recursive: true, force: true });
}

export async function writeOpenIssuesIndex(docsRoot: string, issues: IssueWithAttachments[]) {
  await mkdir(docsRoot, { recursive: true });
  await writeFile(
    path.join(docsRoot, "open-issues.md"),
    generateOpenIssuesMarkdown(issues),
    "utf8",
  );
}

export function isManagedSyncFile(name: string): boolean {
  return MANAGED_FILE_PREFIXES.some(
    (prefix) => name === prefix || name.startsWith(prefix),
  );
}

export async function listOrphanIssueFolders(docsRoot: string, activeFolderNames: Set<string>) {
  const entries = await readdir(docsRoot, { withFileTypes: true }).catch(() => []);
  const orphans: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name === ".gitkeep") {
      continue;
    }

    if (!activeFolderNames.has(entry.name)) {
      orphans.push(entry.name);
    }
  }

  return orphans;
}

export async function readIssueNumbersFromOpenIndex(docsRoot: string): Promise<number[]> {
  const indexPath = path.join(docsRoot, "open-issues.md");

  try {
    const content = await readFile(indexPath, "utf8");
    const matches = content.matchAll(/^## #(\d+) /gm);
    return [...matches].map((match) => Number.parseInt(match[1] ?? "", 10)).filter(Number.isFinite);
  } catch {
    return [];
  }
}
