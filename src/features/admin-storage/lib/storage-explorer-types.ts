import type { StorageExplorerEnvironment } from "@/features/admin-storage/lib/storage-explorer-environment";

export type StorageItemHealth =
  | "ok"
  | "staging_expired"
  | "linked_duplicate"
  | "ut_orphan"
  | "json_orphan"
  | "legacy"
  | "duplicate_key";

export type StorageExplorerDbSource =
  | "estimate_attachment"
  | "estimate_attachment_thumb"
  | "staging"
  | "request_json"
  | "issue"
  | "pdf"
  | "logo"
  | "uploadthing_only";

export type StorageExplorerItemClient = {
  id: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string | null;
  fileSizeBytes: string | null;
  isThumbnail: boolean;
  healthStatus: StorageItemHealth;
  quotaCounted: boolean;
  createdAt: string;
  workspaceId: string | null;
  workspaceName: string | null;
  workspaceSlug: string | null;
  estimateId: string | null;
  estimateTitle: string | null;
  estimateRequestId: string | null;
  issueId: string | null;
  issueNumber: number | null;
  uploadSource: string | null;
  dbSource: StorageExplorerDbSource;
  contextHref: string | null;
  stagingStatus: string | null;
};

export type StorageExplorerNodeStats = {
  fileCount: number;
  totalBytes: string;
};

export type StorageExplorerTreeNode = {
  id: string;
  label: string;
  kind: "root" | "environment" | "group" | "workspace" | "estimate" | "issue" | "category";
  stats: StorageExplorerNodeStats;
  children?: StorageExplorerTreeNode[];
  workspaceId?: string;
  workspaceSlug?: string;
  storageUsedBytes?: string;
  storageLimitBytes?: string;
  environment?: StorageExplorerEnvironment;
  isCurrentEnvironment?: boolean;
};

export type StorageExplorerSummary = {
  currentEnvironment: StorageExplorerEnvironment;
  quotaCountedBytes: string;
  quotaCountedFiles: number;
  nonQuotaBytes: string;
  nonQuotaFiles: number;
  workspaceCount: number;
  utScanAvailable: boolean;
  lastUtScanAt: string | null;
  utTotalFiles: number | null;
  utTotalBytes: string | null;
  utOrphanFiles: number | null;
};

export type StorageExplorerSortKey =
  | "dateDesc"
  | "dateAsc"
  | "nameAsc"
  | "nameDesc"
  | "sizeDesc"
  | "sizeAsc";

export type UploadThingFileRecord = {
  id: string;
  key: string;
  customId: string | null;
  name: string;
  size: number;
  status: string;
  uploadedAt: number;
};

export type ReconcileResult = {
  scannedAt: string;
  totalUtFiles: number;
  totalUtBytes: string;
  utOrphanFiles: number;
  utOrphanBytes: string;
};
