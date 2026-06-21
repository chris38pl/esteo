"use server";

import { parseNodeId, normalizeNodeId } from "@/features/admin-storage/lib/storage-explorer-node-ids";
import type {
  ReconcileResult,
  StorageExplorerItemClient,
  StorageExplorerSortKey,
  StorageExplorerSummary,
  StorageExplorerTreeNode,
} from "@/features/admin-storage/lib/storage-explorer-types";
import {
  getStorageExplorerSummary,
  getStorageExplorerTree,
  listStorageExplorerItems,
} from "@/features/admin-storage/server/storage-explorer-repository";
import { reconcileWithUploadThing } from "@/features/admin-storage/server/storage-explorer-reconcile";
import { getStorageProvider } from "@/features/attachments/server/storage";
import type { Locale } from "@/lib/locale";
import type { PaginatedResult } from "@/lib/pagination";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  console.error(error);
  return { success: false, error: "Something went wrong." };
}

export async function getStorageExplorerTreeAction(
  locale: Locale = "pl",
): Promise<ActionResult<StorageExplorerTreeNode>> {
  try {
    await assertPlatformAdminAccess(locale);
    const tree = await getStorageExplorerTree();
    return { success: true, data: tree };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getStorageExplorerSummaryAction(
  locale: Locale = "pl",
): Promise<ActionResult<StorageExplorerSummary>> {
  try {
    await assertPlatformAdminAccess(locale);
    const summary = await getStorageExplorerSummary();
    return { success: true, data: summary };
  } catch (error) {
    return toActionError(error);
  }
}

export async function listStorageExplorerItemsAction(input: {
  locale: Locale;
  nodeId: string;
  page?: number;
  pageSize?: number;
  sort?: StorageExplorerSortKey;
  search?: string;
}): Promise<ActionResult<PaginatedResult<StorageExplorerItemClient>>> {
  try {
    await assertPlatformAdminAccess(input.locale);

    const node = parseNodeId(normalizeNodeId(input.nodeId));
    if (!node) {
      return { success: false, error: "Invalid node." };
    }

    const data = await listStorageExplorerItems({
      node,
      locale: input.locale,
      pagination: {
        page: Math.max(1, input.page ?? 1),
        pageSize: Math.min(50, Math.max(1, input.pageSize ?? 20)),
      },
      sort: input.sort ?? "dateDesc",
      search: input.search ?? "",
    });

    return { success: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reconcileUploadThingAction(
  locale: Locale = "pl",
): Promise<ActionResult<ReconcileResult>> {
  try {
    await assertPlatformAdminAccess(locale);
    const data = await reconcileWithUploadThing();
    return { success: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getAdminStorageSignedUrlAction(input: {
  locale: Locale;
  storageKey: string;
}): Promise<ActionResult<{ url: string }>> {
  try {
    await assertPlatformAdminAccess(input.locale);

    if (!input.storageKey.trim()) {
      return { success: false, error: "Missing storage key." };
    }

    const storage = getStorageProvider();
    const url = await storage.getSignedUrl(input.storageKey, { expiresInSeconds: 15 * 60 });

    return { success: true, data: { url } };
  } catch (error) {
    return toActionError(error);
  }
}
