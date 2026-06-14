import type { Issue, IssueAttachment } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { mkdir, rm } from "node:fs/promises";

import { buildIssueFolderName } from "../src/features/issues/lib/slugify-issue-title";
import { downloadUploadThingFile } from "./sync-issues/download-screenshot";
import {
  listOrphanIssueFolders,
  removeIssueFolder,
  upsertIssueFolder,
  writeOpenIssuesIndex,
  type IssueWithAttachments,
} from "./sync-issues/sync-managed-files";

function parseArgs(argv: string[]) {
  let issueNumbers: number[] | undefined;

  for (const arg of argv) {
    if (arg.startsWith("--issue=")) {
      const raw = arg.slice("--issue=".length);
      issueNumbers = raw
        .split(",")
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value) && value > 0);
    }
  }

  return { issueNumbers };
}

async function listIssuesForSync(
  prisma: PrismaClient,
  numbers?: number[],
): Promise<IssueWithAttachments[]> {
  return prisma.issue.findMany({
    where: {
      status: { in: ["OPEN", "IN_PROGRESS"] },
      ...(numbers && numbers.length > 0 ? { number: { in: numbers } } : {}),
    },
    include: {
      attachments: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { number: "asc" },
  });
}

async function listIssuesForFolderCleanup(
  prisma: PrismaClient,
): Promise<Array<Pick<Issue, "number" | "folderSlug">>> {
  return prisma.issue.findMany({
    where: {
      status: { in: ["RESOLVED", "ARCHIVED"] },
    },
    select: {
      number: true,
      folderSlug: true,
    },
  });
}

async function main() {
  const { issueNumbers } = parseArgs(process.argv.slice(2));

  if (process.env.VERCEL_ENV === "production") {
    console.error("sync:issues is disabled in Vercel Production.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL (set by sync-issues.mjs wrapper).");
    process.exit(1);
  }

  if (!process.env.UPLOADTHING_TOKEN) {
    console.error("Missing UPLOADTHING_TOKEN.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const docsRoot = path.join(process.cwd(), "docs", "issues");
  await mkdir(docsRoot, { recursive: true });

  try {
    const openIssues = await listIssuesForSync(prisma, issueNumbers);

    if (issueNumbers && issueNumbers.length > 0) {
      const foundNumbers = new Set(openIssues.map((issue) => issue.number));
      const missing = issueNumbers.filter((number) => !foundNumbers.has(number));

      if (missing.length > 0) {
        console.warn(
          `Skipping issue(s) not OPEN/IN_PROGRESS or missing: ${missing.join(", ")}`,
        );
      }
    }

    for (const issue of openIssues) {
      console.log(
        `Upserting #${issue.number} → ${buildIssueFolderName(issue.number, issue.folderSlug)}`,
      );
      await upsertIssueFolder({
        docsRoot,
        issue,
        downloadFile: downloadUploadThingFile,
      });
    }

    const closedIssues = await listIssuesForFolderCleanup(prisma);
    for (const issue of closedIssues) {
      console.log(`Removing closed folder #${issue.number}`);
      await removeIssueFolder(docsRoot, issue.number, issue.folderSlug);
    }

    const activeFolderNames = new Set(
      openIssues.map((issue) => buildIssueFolderName(issue.number, issue.folderSlug)),
    );

    const orphans = await listOrphanIssueFolders(docsRoot, activeFolderNames);
    for (const orphan of orphans) {
      console.log(`Removing orphan folder ${orphan}`);
      await rm(path.join(docsRoot, orphan), { recursive: true, force: true });
    }

    if (!issueNumbers || issueNumbers.length === 0) {
      const allOpenForIndex = await listIssuesForSync(prisma);
      await writeOpenIssuesIndex(docsRoot, allOpenForIndex);
    }

    console.log(`Sync complete. ${openIssues.length} issue folder(s) updated.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
