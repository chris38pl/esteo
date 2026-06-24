import { access, readFile } from "node:fs/promises";

import { PrismaClient } from "@prisma/client";

import {
  buildIssueCommentDraftRelativePath,
  formatImplementationCommentValidationErrors,
  validateImplementationComment,
} from "../src/features/issues/lib/issue-implementation-comment";
import { buildIssueCommentDraftPath } from "./lib/issue-comment-draft-path";

const ISSUE_COMMENT_BODY_MAX_LENGTH = 4000;

type ParsedArgs = {
  issueNumber?: number;
  message?: string;
  messageFile?: string;
  useDraft: boolean;
  authorEmail?: string;
  resolve: boolean;
  fixedIn?: string;
  lenient: boolean;
};

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { resolve: false, useDraft: false, lenient: false };

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

    if (arg === "--draft") {
      parsed.useDraft = true;
      continue;
    }

    if (arg === "--lenient") {
      parsed.lenient = true;
      continue;
    }

    if (arg.startsWith("--fixed-in=")) {
      parsed.fixedIn = arg.slice("--fixed-in=".length);
    }
  }

  return parsed;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveMessage(args: ParsedArgs): Promise<string> {
  if (args.useDraft) {
    if (!args.issueNumber) {
      throw new Error("--draft requires --issue=N.");
    }

    const draftPath = buildIssueCommentDraftPath(args.issueNumber);
    if (!(await fileExists(draftPath))) {
      throw new Error(
        [
          `Draft file not found: ${buildIssueCommentDraftRelativePath(args.issueNumber)}`,
          "Write your full implementation summary there first (same text as in chat), then rerun with --draft.",
        ].join("\n"),
      );
    }

    return readFile(draftPath, "utf8");
  }

  if (args.messageFile) {
    return readFile(args.messageFile, "utf8");
  }

  return args.message ?? "";
}

function printUsage(): void {
  console.error(
    [
      "Usage:",
      "  npm run issue:comment -- --issue=123 --resolve --draft",
      "  npm run issue:comment -- --issue=123 --resolve --message-file=path/to/summary.md",
      "",
      "Workflow (Cursor):",
      "  1. Save full summary to .cursor/issue-comments/123.md",
      "  2. npm run issue:comment -- --issue=123 --resolve --draft",
      "",
      "Options:",
      "  --issue=N                 Issue number.",
      "  --draft                   Read .cursor/issue-comments/{N}.md (preferred for agents).",
      "  --message-file=PATH       Read comment body from a file.",
      "  --message=TEXT            Comment body (short text only; prefer --draft on Windows).",
      "  --resolve                 Also set issue status to RESOLVED (requires substantive summary).",
      "  --fixed-in=TEXT           Optional Issue.fixedIn value.",
      "  --lenient                 Skip anti-stub validation (manual use only).",
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

  if (!args.useDraft && !args.messageFile && !args.message) {
    printUsage();
    throw new Error("Missing --draft, --message-file, or --message.");
  }

  const body = (await resolveMessage(args)).trim();
  if (!body) {
    printUsage();
    throw new Error("Comment body is empty.");
  }

  if (body.length > ISSUE_COMMENT_BODY_MAX_LENGTH) {
    throw new Error(`Comment exceeds ${ISSUE_COMMENT_BODY_MAX_LENGTH} characters.`);
  }

  if (args.resolve && !args.lenient) {
    const validation = validateImplementationComment(body);
    if (!validation.ok) {
      throw new Error(
        [
          formatImplementationCommentValidationErrors(validation.errors),
          "",
          "Write the full implementation summary to:",
          `  ${buildIssueCommentDraftRelativePath(issueNumber)}`,
          "Then run:",
          `  npm run issue:comment -- --issue=${issueNumber} --resolve --draft`,
        ].join("\n"),
      );
    }
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
