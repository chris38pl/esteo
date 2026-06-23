"use server";

import { revalidatePath } from "next/cache";

import {
  bulkUpdateIssueStatusSchema,
  type AdminIssueStatus,
  updateIssueDetailsSchema,
  updateIssueStatusSchema,
} from "@/features/issues/schemas/issue";
import { ISSUE_ACTIVITY_ACTIONS } from "@/features/issues/lib/issue-activity-types";
import { createIssueActivityLog } from "@/features/issues/server/activity-repository";
import { resolveIssueWithComment } from "@/features/issues/server/comments-repository";
import {
  bulkUpdateIssueStatus,
  getIssueAttachmentById,
  getIssueByNumber,
  listIssuesForAdmin,
  updateIssueDetails,
  updateIssueStatus,
} from "@/features/issues/server/repository";
import { assertIssueTrackerEnabled } from "@/lib/issue-tracker/guard";
import type { Locale } from "@/lib/locale";
import { assertIssueViewerAccess } from "@/server/auth/require-issue-viewer";
import { getStorageProvider } from "@/features/attachments/server/storage";
import { getIssuesBasePath } from "@/features/issues/lib/issues-base-path";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function revalidateIssuePaths(locale: Locale, number?: number) {
  for (const variant of ["admin", "qa"] as const) {
    const base = getIssuesBasePath(locale, variant);
    revalidatePath(base);
    if (number !== undefined) {
      revalidatePath(`${base}/${number}`);
    }
  }
}

export async function listAdminIssuesAction(locale: Locale = "pl") {
  try {
    assertIssueTrackerEnabled();
    await assertIssueViewerAccess(locale);
    const items = await listIssuesForAdmin();
    return { success: true as const, data: items };
  } catch (error) {
    console.error("[listAdminIssuesAction]", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to load issues.",
    };
  }
}

export async function getAdminIssueAction(number: number, locale: Locale = "pl") {
  try {
    assertIssueTrackerEnabled();
    await assertIssueViewerAccess(locale);
    const issue = await getIssueByNumber(number);

    if (!issue) {
      return { success: false as const, error: "Issue not found." };
    }

    return { success: true as const, data: issue };
  } catch (error) {
    console.error("[getAdminIssueAction]", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to load issue.",
    };
  }
}

export async function bulkUpdateIssueStatusAction(
  input: { numbers: number[]; status: AdminIssueStatus },
  locale: Locale = "pl",
) {
  try {
    assertIssueTrackerEnabled();
    await assertIssueViewerAccess(locale);
    const parsed = bulkUpdateIssueStatusSchema.parse(input);

    if (parsed.status === "RESOLVED") {
      return {
        success: false as const,
        error: "Resolving issues requires an implementation comment per issue.",
      };
    }

    const updatedCount = await bulkUpdateIssueStatus(parsed.numbers, parsed.status);

    if (updatedCount === 0) {
      return { success: false as const, error: "No issues were updated." };
    }

    revalidateIssuePaths(locale);
    return { success: true as const, data: { updatedCount } };
  } catch (error) {
    console.error("[bulkUpdateIssueStatusAction]", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update statuses.",
    };
  }
}

export async function updateIssueStatusAction(
  input: {
    number: number;
    status: AdminIssueStatus;
    resolutionComment?: string;
    fixedIn?: string;
  },
  locale: Locale = "pl",
) {
  try {
    assertIssueTrackerEnabled();
    const user = await assertIssueViewerAccess(locale);
    const parsed = updateIssueStatusSchema.parse(input);
    const existing = await getIssueByNumber(parsed.number);

    if (!existing) {
      return { success: false as const, error: "Issue not found." };
    }

    if (parsed.status === "RESOLVED" && !parsed.resolutionComment) {
      return {
        success: false as const,
        error: "Resolving an issue requires an implementation comment.",
      };
    }

    const fixedIn = parsed.fixedIn?.trim() || undefined;
    const resolvedResult =
      parsed.status === "RESOLVED"
        ? await resolveIssueWithComment({
            number: parsed.number,
            authorUserId: user.id,
            body: parsed.resolutionComment ?? "",
            fixedIn,
          })
        : null;
    const updated = resolvedResult?.issue ?? (await updateIssueStatus(parsed.number, parsed.status));

    if (!updated) {
      return { success: false as const, error: "Issue not found." };
    }

    if (resolvedResult) {
      await createIssueActivityLog({
        issueId: existing.id,
        actorType: "USER",
        actorUserId: user.id,
        action: ISSUE_ACTIVITY_ACTIONS.comment_added,
        metadata: {
          commentId: resolvedResult.comment.id,
          commentBody: resolvedResult.comment.body,
        },
      });
    }

    if (existing.status !== parsed.status) {
      await createIssueActivityLog({
        issueId: existing.id,
        actorType: "USER",
        actorUserId: user.id,
        action: ISSUE_ACTIVITY_ACTIONS.status_changed,
        metadata: {
          oldStatus: existing.status,
          newStatus: updated.status,
          ...(fixedIn ? { fixedIn } : {}),
        },
      });

      const { notifyIssueStatusChanged } = await import(
        "@/features/notifications/server/notification-emit-helpers"
      );
      const { fireNotification } = await import(
        "@/features/notifications/server/notification-workspace-context"
      );
      fireNotification(
        notifyIssueStatusChanged({
          locale,
          issueNumber: updated.number,
          issueTitle: updated.title,
          oldStatus: existing.status,
          newStatus: updated.status,
        }),
      );
    }

    revalidateIssuePaths(locale, parsed.number);
    return { success: true as const, data: updated };
  } catch (error) {
    console.error("[updateIssueStatusAction]", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update status.",
    };
  }
}

export async function updateIssueDetailsAction(
  input: {
    number: number;
    title: string;
    description: string;
  },
  locale: Locale = "pl",
) {
  try {
    assertIssueTrackerEnabled();
    const user = await assertIssueViewerAccess(locale);
    const parsed = updateIssueDetailsSchema.parse(input);
    const existing = await getIssueByNumber(parsed.number);

    if (!existing) {
      return { success: false as const, error: "Issue not found." };
    }

    const titleChanged = existing.title !== parsed.title;
    const descriptionChanged = existing.description !== parsed.description;

    if (!titleChanged && !descriptionChanged) {
      return { success: true as const, data: existing };
    }

    const updated = await updateIssueDetails(parsed.number, {
      title: parsed.title,
      description: parsed.description,
    });

    if (!updated) {
      return { success: false as const, error: "Issue not found." };
    }

    if (titleChanged) {
      await createIssueActivityLog({
        issueId: existing.id,
        actorType: "USER",
        actorUserId: user.id,
        action: ISSUE_ACTIVITY_ACTIONS.title_changed,
        metadata: {
          oldTitle: existing.title,
          newTitle: parsed.title,
        },
      });
    }

    if (descriptionChanged) {
      await createIssueActivityLog({
        issueId: existing.id,
        actorType: "USER",
        actorUserId: user.id,
        action: ISSUE_ACTIVITY_ACTIONS.description_changed,
        metadata: {
          oldDescription: existing.description,
          newDescription: parsed.description,
        },
      });
    }

    revalidateIssuePaths(locale, parsed.number);
    return { success: true as const, data: updated };
  } catch (error) {
    console.error("[updateIssueDetailsAction]", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update issue details.",
    };
  }
}

export async function getIssueAttachmentSignedUrlAction(
  attachmentId: string,
  locale: Locale = "pl",
): Promise<ActionResult<{ url: string }>> {
  try {
    assertIssueTrackerEnabled();
    await assertIssueViewerAccess(locale);

    const attachment = await getIssueAttachmentById(attachmentId);

    if (!attachment) {
      return { success: false, error: "Attachment not found." };
    }

    const storage = getStorageProvider();
    const url = await storage.getSignedUrl(attachment.storageKey, {
      expiresInSeconds: 15 * 60,
    });

    return { success: true, data: { url } };
  } catch (error) {
    console.error("[getIssueAttachmentSignedUrlAction]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get attachment URL.",
    };
  }
}
