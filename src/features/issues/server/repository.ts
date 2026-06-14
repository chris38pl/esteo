import "server-only";

import type { Issue, IssueAttachment, IssueStatus, Prisma } from "@prisma/client";

import { prisma } from "@/db/client";

export type IssueWithAttachments = Issue & {
  attachments: IssueAttachment[];
};

const issueListSelect = {
  id: true,
  number: true,
  folderSlug: true,
  type: true,
  priority: true,
  status: true,
  title: true,
  description: true,
  reproductionSteps: true,
  expectedBehavior: true,
  actualBehavior: true,
  pageUrl: true,
  context: true,
  locale: true,
  userAgent: true,
  deviceType: true,
  viewportWidth: true,
  viewportHeight: true,
  environment: true,
  fixedIn: true,
  reportedById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.IssueSelect;

export async function createIssueRecord(input: Prisma.IssueCreateInput): Promise<Issue> {
  return prisma.issue.create({ data: input });
}

export async function getIssueByNumber(number: number): Promise<IssueWithAttachments | null> {
  return prisma.issue.findUnique({
    where: { number },
    include: {
      attachments: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function listIssuesForAdmin(): Promise<
  Pick<
    Issue,
    "number" | "title" | "type" | "priority" | "status" | "createdAt" | "folderSlug"
  >[]
> {
  return prisma.issue.findMany({
    select: {
      number: true,
      title: true,
      type: true,
      priority: true,
      status: true,
      createdAt: true,
      folderSlug: true,
    },
    orderBy: [{ status: "asc" }, { number: "desc" }],
  });
}

export async function updateIssueStatus(
  number: number,
  status: IssueStatus,
): Promise<Issue | null> {
  try {
    return await prisma.issue.update({
      where: { number },
      data: { status },
    });
  } catch {
    return null;
  }
}

export async function getIssueAttachmentById(
  attachmentId: string,
): Promise<(IssueAttachment & { issue: Pick<Issue, "number"> }) | null> {
  return prisma.issueAttachment.findUnique({
    where: { id: attachmentId },
    include: {
      issue: {
        select: { number: true },
      },
    },
  });
}

export async function listIssuesForSync(input: {
  numbers?: number[];
}): Promise<IssueWithAttachments[]> {
  const statusFilter: IssueStatus[] = ["OPEN", "IN_PROGRESS"];

  return prisma.issue.findMany({
    where: {
      status: { in: statusFilter },
      ...(input.numbers && input.numbers.length > 0
        ? { number: { in: input.numbers } }
        : {}),
    },
    include: {
      attachments: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { number: "asc" },
  });
}

export async function listIssuesForFolderCleanup(): Promise<
  Pick<Issue, "number" | "folderSlug" | "status">[]
> {
  return prisma.issue.findMany({
    where: {
      status: { in: ["RESOLVED", "ARCHIVED"] },
    },
    select: {
      number: true,
      folderSlug: true,
      status: true,
    },
  });
}

export { issueListSelect };
