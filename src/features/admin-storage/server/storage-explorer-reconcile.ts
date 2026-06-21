import "server-only";

import { collectAllDbStorageKeys } from "@/features/admin-storage/server/storage-explorer-db-keys";
import type {
  ReconcileResult,
  UploadThingFileRecord,
} from "@/features/admin-storage/lib/storage-explorer-types";
import { uploadThingStorageProvider } from "@/features/attachments/server/storage/uploadthing-provider";

const CACHE_TTL_MS = 5 * 60 * 1000;

type ReconcileCache = {
  scannedAt: Date;
  totalUtFiles: number;
  totalUtBytes: bigint;
  utOrphanFiles: UploadThingFileRecord[];
};

let reconcileCache: ReconcileCache | null = null;

export function getUtOrphanFilesFromCache(): ReconcileCache | null {
  if (!reconcileCache) {
    return null;
  }

  if (Date.now() - reconcileCache.scannedAt.getTime() > CACHE_TTL_MS) {
    reconcileCache = null;
    return null;
  }

  return reconcileCache;
}

export async function reconcileWithUploadThing(): Promise<ReconcileResult> {
  const [utFiles, dbKeys] = await Promise.all([
    uploadThingStorageProvider.listAllFiles(),
    collectAllDbStorageKeys(),
  ]);

  const utOrphanFiles = utFiles.filter((file) => !dbKeys.has(file.key));
  const totalUtBytes = utFiles.reduce((sum, file) => sum + BigInt(file.size), BigInt(0));
  const utOrphanBytes = utOrphanFiles.reduce((sum, file) => sum + BigInt(file.size), BigInt(0));

  reconcileCache = {
    scannedAt: new Date(),
    totalUtFiles: utFiles.length,
    totalUtBytes,
    utOrphanFiles,
  };

  return {
    scannedAt: reconcileCache.scannedAt.toISOString(),
    totalUtFiles: utFiles.length,
    totalUtBytes: totalUtBytes.toString(),
    utOrphanFiles: utOrphanFiles.length,
    utOrphanBytes: utOrphanBytes.toString(),
  };
}
