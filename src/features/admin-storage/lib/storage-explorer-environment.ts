export const STORAGE_EXPLORER_ENVIRONMENTS = ["development", "staging", "production"] as const;

export type StorageExplorerEnvironment = (typeof STORAGE_EXPLORER_ENVIRONMENTS)[number];

export function isStorageExplorerEnvironment(value: string): value is StorageExplorerEnvironment {
  return (STORAGE_EXPLORER_ENVIRONMENTS as readonly string[]).includes(value);
}

/** Maps runtime deployment to explorer environment bucket. */
export function resolveCurrentStorageExplorerEnvironment(): StorageExplorerEnvironment {
  if (process.env.VERCEL_ENV === "production") {
    return "production";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return "staging";
  }

  return "development";
}

export function storageEnvironmentNodeId(environment: StorageExplorerEnvironment): string {
  return `env:${environment}`;
}

export function prefixStorageExplorerNodeId(
  environment: StorageExplorerEnvironment,
  nodeId: string,
): string {
  if (nodeId === "all") {
    return "all";
  }

  if (nodeId.startsWith("env:")) {
    return nodeId;
  }

  return `env:${environment}:${nodeId}`;
}

export function defaultStorageExplorerNodeId(
  environment: StorageExplorerEnvironment = resolveCurrentStorageExplorerEnvironment(),
): string {
  return prefixStorageExplorerNodeId(environment, "workspaces");
}
