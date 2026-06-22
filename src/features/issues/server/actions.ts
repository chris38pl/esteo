"use server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/client";
import { serializeIssueContext } from "@/features/issues/lib/issue-context";
import { slugifyIssueTitle } from "@/features/issues/lib/slugify-issue-title";
import { createIssueSchema, type CreateIssueInput } from "@/features/issues/schemas/issue";
import { allocateIssueNumber } from "@/features/issues/server/allocate-issue-number";
import { linkIssueStagingAttachmentsInTx } from "@/features/issues/server/issue-staging-attachment-service";
import { createIssueRecord } from "@/features/issues/server/repository";
import { resolveIssueEnvironment } from "@/lib/app-environment";
import { assertIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import type { Locale } from "@/lib/locale";
import { syncUserFromClerk } from "@/server/auth/sync-user";
import {
  logMutationActionFailure,
  mapDatabaseUnavailableActionError,
} from "@/server/db/mutation-action-errors";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export async function createIssueAction(
  input: CreateIssueInput,
  locale: Locale,
): Promise<ActionResult<{ issueId: string; number: number }>> {
  let userId: string | undefined;

  try {
    assertIssueTrackerEnabled();
    const user = await syncUserFromClerk();

    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    userId = user.id;

    const parsed = createIssueSchema.parse(input);

    const number = await allocateIssueNumber();
    const folderSlug = slugifyIssueTitle(parsed.title);
    const context = serializeIssueContext(parsed.context ?? null);

    const data: Prisma.IssueCreateInput = {
      number,
      folderSlug,
      type: parsed.type,
      priority: parsed.priority,
      title: parsed.title,
      description: parsed.description,
      reproductionSteps: parsed.reproductionSteps ?? null,
      expectedBehavior: parsed.expectedBehavior ?? null,
      actualBehavior: parsed.actualBehavior ?? null,
      pageUrl: parsed.pageUrl,
      context: context ?? undefined,
      locale: parsed.locale,
      userAgent: parsed.userAgent,
      deviceType: parsed.deviceType,
      viewportWidth: parsed.viewportWidth,
      viewportHeight: parsed.viewportHeight,
      environment: resolveIssueEnvironment(),
      reportedBy: { connect: { id: user.id } },
    };

    const issue = await prisma.$transaction(async (tx) => {
      const created = await createIssueRecord(data, tx);

      if (parsed.attachmentIds.length > 0) {
        await linkIssueStagingAttachmentsInTx(tx, {
          issueId: created.id,
          uploadedById: user.id,
          attachmentIds: parsed.attachmentIds,
        });
      }

      return created;
    });

    return {
      success: true,
      data: {
        issueId: issue.id,
        number: issue.number,
      },
    };
  } catch (error) {
    logMutationActionFailure("create_issue_failed", { userId }, error);

    const dbError = await mapDatabaseUnavailableActionError(error, locale);
    if (dbError) {
      return dbError;
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create issue.",
    };
  }
}
