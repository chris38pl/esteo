import { readFile } from "node:fs/promises";

import { PrismaClient } from "@prisma/client";

const ISSUE_COMMENT_BODY_MAX_LENGTH = 4000;

type ParsedArgs = {
  issueNumber?: number;
  message?: string;
  messageFile?: string;
  authorEmail?: string;
  resolve: boolean;
  fixedIn?: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { resolve: false };

  for (const arg of argv) {
    if (arg.startsWith("--issue=")) {
      parsed.issueNumber = Number.parseInt(arg.slice("--issue=".length), 10);
      continue;
    }

    if (arg.startsWith("--message=")) {
      parsed.message = arg.slice("--message=".length);
      continue;
    }

    if (arg.startsWith("--message-file=")) {
      parsed.messageFile = arg.slice("--message-file=".length);
      continue;
    }

    if (arg.startsWith("--author-email=")) {
      parsed.authorEmail = arg.slice("--author-email=".length);
      continue;
    }

    if (arg === "--resolve") {
      parsed.resolve = true;
      continue;
    }

    if (arg.startsWith("--fixed-in=")) {
      parsed.fixedIn = arg.slice("--fixed-in=".length);
    }
  }

  return parsed;
}

async function resolveMessage(args: ParsedArgs): Promise<string> {
  if (args.messageFile) {
    return readFile(args.messageFile, "utf8");
  }

  return args.message ?? "";
}

function printUsage(): void {
  console.error(
    [
      "Usage:",
      '  npm run issue:comment -- --issue=123 --message="Zaimplementowano: ..."',
      '  npm run issue:comment -- --issue=123 --resolve --message-file=resolution.md',
      "",
      "Options:",
      "  --issue=N                 Issue number.",
      "  --message=TEXT            Comment body.",
      "  --message-file=PATH       Read comment body from a file.",
      "  --resolve                 Also set issue status to RESOLVED.",
      "  --fixed-in=TEXT           Optional Issue.fixedIn value.",
      "  --author-email=EMAIL      Optional real user author. Defaults to ISSUE_COMMENT_AUTHOR_EMAIL.",
      "                            Without an author email, the actor is Cursor AI.",
      "  --local                   Use local DATABASE_URL instead of staging (handled by wrapper).",
    ].join("\n"),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const issueNumber = args.issueNumber;

  if (!issueNumber || !Number.isFinite(issueNumber) || issueNumber <= 0) {
    printUsage();
    throw new Error("Missing or invalid --issue.");
  }

  const body = (await resolveMessage(args)).trim();
  if (!body) {
    printUsage();
    throw new Error("Missing --message or --message-file.");
  }

  if (body.length > ISSUE_COMMENT_BODY_MAX_LENGTH) {
    throw new Error(`Comment exceeds ${ISSUE_COMMENT_BODY_MAX_LENGTH} characters.`);
  }

  const authorEmail =
    args.authorEmail?.trim() ||
    process.env.ISSUE_COMMENT_AUTHOR_EMAIL?.trim();
  const actorType = authorEmail ? "USER" : "CURSOR_AI";

  const prisma = new PrismaClient();

  try {
    const author = authorEmail
      ? await prisma.user.findUnique({
          where: { email: authorEmail },
          select: { id: true, email: true },
        })
      : null;

    if (authorEmail && !author) {
      throw new Error(`Author user not found for email: ${authorEmail}`);
    }

    const issue = await prisma.issue.findUnique({
      where: { number: issueNumber },
      select: { id: true, number: true, title: true },
    });

    if (!issue) {
      throw new Error(`Issue #${issueNumber} not found.`);
    }

    const result = await prisma.$transaction(async (tx) => {
      const comment = await tx.issueComment.create({
        data: {
          issueId: issue.id,
          actorType,
          authorUserId: author?.id ?? null,
          body,
        },
        select: { id: true, body: true, createdAt: true },
      });

      await tx.issueActivityLog.create({
        data: {
          issueId: issue.id,
          actorType,
          actorUserId: author?.id ?? null,
          action: "comment_added",
          metadata: {
            commentId: comment.id,
            commentBody: comment.body,
          },
        },
      });

      if (!args.resolve) {
        return { comment, resolved: false };
      }

      const existing = await tx.issue.findUnique({
        where: { number: issue.number },
        select: { status: true },
      });

      await tx.issue.update({
        where: { number: issue.number },
        data: {
          status: "RESOLVED",
          ...(args.fixedIn?.trim() ? { fixedIn: args.fixedIn.trim() } : {}),
        },
      });

      await tx.issueActivityLog.create({
        data: {
          issueId: issue.id,
          actorType,
          actorUserId: author?.id ?? null,
          action: "status_changed",
          metadata: {
            oldStatus: existing?.status ?? null,
            newStatus: "RESOLVED",
            ...(args.fixedIn?.trim() ? { fixedIn: args.fixedIn.trim() } : {}),
          },
        },
      });

      return { comment, resolved: true };
    });

    console.log(
      `Added comment ${result.comment.id} to issue #${issue.number} as ${
        author?.email ?? "Cursor AI"
      }.`,
    );

    if (result.resolved) {
      console.log(`Issue #${issue.number} marked RESOLVED.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
