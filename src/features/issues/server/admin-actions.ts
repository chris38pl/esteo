"use server";

import { revalidatePath } from "next/cache";

import { updateIssueStatusSchema } from "@/features/issues/schemas/issue";
import {
  getIssueAttachmentById,
  getIssueByNumber,
  listIssuesForAdmin,
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

export async function updateIssueStatusAction(
  input: { number: number; status: "OPEN" | "RESOLVED" },
  locale: Locale = "pl",
) {
  try {
    assertIssueTrackerEnabled();
    await assertIssueViewerAccess(locale);
    const parsed = updateIssueStatusSchema.parse(input);
    const updated = await updateIssueStatus(parsed.number, parsed.status);

    if (!updated) {
      return { success: false as const, error: "Issue not found." };
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
