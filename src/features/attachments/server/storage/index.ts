import "server-only";

import { uploadThingStorageProvider } from "@/features/attachments/server/storage/uploadthing-provider";
import type { StorageProvider } from "@/features/attachments/server/storage/types";

export function getStorageProvider(): StorageProvider {
  return uploadThingStorageProvider;
}
