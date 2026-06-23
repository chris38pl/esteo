import type { Issue, IssueAttachment } from "@prisma/client";

import { parseIssueContext } from "@/features/issues/lib/issue-context";
import { buildIssueFolderName } from "@/features/issues/lib/slugify-issue-title";

type IssueMarkdownComment = {
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

export function generateIssueMarkdown(
  issue: Issue & { attachments: IssueAttachment[]; comments: IssueMarkdownComment[] },
): string {
  const context = parseIssueContext(issue.context);
  const lines = [
    `# Issue #${issue.number}`,
    "",
    `Title:`,
    issue.title,
    "",
    `Type:`,
    issue.type,
    "",
    `Priority:`,
    issue.priority,
    "",
    `Status:`,
    issue.status,
    "",
    `Environment:`,
    issue.environment,
    "",
    `Page:`,
    issue.pageUrl,
    "",
    `Workspace:`,
    context?.workspaceSlug ?? "—",
    "",
    `Device:`,
    `${issue.deviceType} (${issue.viewportWidth}x${issue.viewportHeight})`,
    "",
    `Description:`,
    issue.description,
  ];

  if (issue.reproductionSteps) {
    lines.push("", "Steps:", issue.reproductionSteps);
  }

  if (issue.expectedBehavior) {
    lines.push("", "Expected:", issue.expectedBehavior);
  }

  if (issue.actualBehavior) {
    lines.push("", "Actual:", issue.actualBehavior);
  }

  if (issue.attachments.length > 0) {
    lines.push("", "Attachments:");
    issue.attachments.forEach((attachment, index) => {
      lines.push(`- screenshot-${index + 1}.${extensionForMime(attachment.mimeType)}`);
    });
  }

  if (issue.comments.length > 0) {
    lines.push("", "Comments:");
    appendCommentsMarkdown(lines, issue.comments);
  }

  return lines.join("\n");
}

export function generateIssueContextJson(
  issue: Issue & { attachments: IssueAttachment[] },
  screenshots: Array<{
    id: string;
    storageKey: string;
    updatedAt: string;
    localFile: string;
  }>,
): string {
  const context = parseIssueContext(issue.context);

  return JSON.stringify(
    {
      issueId: issue.number,
      workspaceSlug: context?.workspaceSlug ?? null,
      pageUrl: issue.pageUrl,
      deviceType: issue.deviceType.toLowerCase(),
      viewportWidth: issue.viewportWidth,
      viewportHeight: issue.viewportHeight,
      locale: issue.locale,
      environment: issue.environment,
      screenshots,
    },
    null,
    2,
  );
}

export function generateOpenIssuesMarkdown(
  issues: Array<Pick<Issue, "number" | "title" | "priority" | "type" | "folderSlug">>,
): string {
  const lines = ["# Open Issues", "", `Generated: ${new Date().toISOString()}`, ""];

  for (const issue of issues) {
    lines.push(`## #${issue.number} ${issue.title}`, "");
    lines.push(`Priority: ${issue.priority}`);
    lines.push(`Type: ${issue.type}`);
    lines.push(`Folder: ${buildIssueFolderName(issue.number, issue.folderSlug)}`);
    lines.push("");
  }

  return lines.join("\n");
}

function extensionForMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function appendCommentsMarkdown(lines: string[], comments: IssueMarkdownComment[]): void {
  const repliesByParent = new Map<string, IssueMarkdownComment[]>();
  const topLevel: IssueMarkdownComment[] = [];

  for (const comment of comments) {
    if (comment.parentId) {
      const replies = repliesByParent.get(comment.parentId) ?? [];
      replies.push(comment);
      repliesByParent.set(comment.parentId, replies);
      continue;
    }

    topLevel.push(comment);
  }

  for (const comment of topLevel) {
    lines.push(formatCommentLine(comment));

    for (const reply of repliesByParent.get(comment.id) ?? []) {
      lines.push(`  ${formatCommentLine(reply)}`);
    }
  }
}

function formatCommentLine(comment: IssueMarkdownComment): string {
  const author =
    comment.actorType === "CURSOR_AI"
      ? "Cursor AI"
      : comment.author?.name?.trim() || comment.author?.email || "System";
  return `- ${author} (${comment.createdAt.toISOString()}): ${comment.body}`;
}

export { extensionForMime };
