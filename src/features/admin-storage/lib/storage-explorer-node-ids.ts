import {
  defaultStorageExplorerNodeId,
  isStorageExplorerEnvironment,
  resolveCurrentStorageExplorerEnvironment,
  type StorageExplorerEnvironment,
} from "@/features/admin-storage/lib/storage-explorer-environment";

type ParsedNodeBase = {
  environment: StorageExplorerEnvironment;
};

export type ParsedNodeId =
  | { kind: "all" }
  | ({ kind: "environment" } & ParsedNodeBase)
  | ({ kind: "workspaces" } & ParsedNodeBase)
  | ({ kind: "workspace"; workspaceId: string } & ParsedNodeBase)
  | ({ kind: "workspace_estimates"; workspaceId: string } & ParsedNodeBase)
  | ({ kind: "workspace_estimate"; workspaceId: string; estimateId: string } & ParsedNodeBase)
  | ({ kind: "workspace_staging_active"; workspaceId: string } & ParsedNodeBase)
  | ({ kind: "workspace_staging_linked"; workspaceId: string } & ParsedNodeBase)
  | ({ kind: "workspace_pdfs"; workspaceId: string } & ParsedNodeBase)
  | ({ kind: "workspace_logo"; workspaceId: string } & ParsedNodeBase)
  | ({ kind: "platform" } & ParsedNodeBase)
  | ({ kind: "platform_issues" } & ParsedNodeBase)
  | ({ kind: "platform_issue"; issueId: string } & ParsedNodeBase)
  | ({ kind: "orphans" } & ParsedNodeBase)
  | ({ kind: "orphans_ut_only" } & ParsedNodeBase)
  | ({ kind: "orphans_json_unpromoted" } & ParsedNodeBase)
  | ({ kind: "orphans_legacy" } & ParsedNodeBase)
  | ({ kind: "orphans_duplicate_keys" } & ParsedNodeBase);

export function normalizeNodeId(nodeId: string | null | undefined): string {
  if (!nodeId || nodeId.trim().length === 0) {
    return defaultStorageExplorerNodeId();
  }
  return nodeId.trim();
}

function parseInnerNodeId(rest: string, environment: StorageExplorerEnvironment): ParsedNodeId | null {
  if (rest === "workspaces") return { kind: "workspaces", environment };
  if (rest === "platform") return { kind: "platform", environment };
  if (rest === "platform:issues") return { kind: "platform_issues", environment };
  if (rest === "orphans") return { kind: "orphans", environment };
  if (rest === "orphans:ut-only") return { kind: "orphans_ut_only", environment };
  if (rest === "orphans:json-unpromoted") return { kind: "orphans_json_unpromoted", environment };
  if (rest === "orphans:legacy") return { kind: "orphans_legacy", environment };
  if (rest === "orphans:duplicate-keys") return { kind: "orphans_duplicate_keys", environment };

  if (rest.startsWith("platform:issue:")) {
    const issueId = rest.slice("platform:issue:".length);
    if (issueId) return { kind: "platform_issue", issueId, environment };
  }

  if (rest.startsWith("workspace:")) {
    const workspaceRest = rest.slice("workspace:".length);
    const parts = workspaceRest.split(":");

    if (parts.length === 1 && parts[0]) {
      return { kind: "workspace", workspaceId: parts[0], environment };
    }

    if (parts.length >= 2) {
      const workspaceId = parts[0];
      const section = parts[1];

      if (!workspaceId) return null;

      if (section === "estimates") {
        if (parts.length === 2) return { kind: "workspace_estimates", workspaceId, environment };
        if (parts.length === 4 && parts[2] === "estimate" && parts[3]) {
          return { kind: "workspace_estimate", workspaceId, estimateId: parts[3], environment };
        }
      }

      if (section === "staging-active") {
        return { kind: "workspace_staging_active", workspaceId, environment };
      }
      if (section === "staging-linked") {
        return { kind: "workspace_staging_linked", workspaceId, environment };
      }
      if (section === "pdfs") return { kind: "workspace_pdfs", workspaceId, environment };
      if (section === "logo") return { kind: "workspace_logo", workspaceId, environment };
    }
  }

  return null;
}

export function parseNodeId(nodeId: string): ParsedNodeId | null {
  const id = normalizeNodeId(nodeId);

  if (id === "all") return { kind: "all" };

  if (id.startsWith("env:")) {
    const withoutEnv = id.slice("env:".length);
    const colonIndex = withoutEnv.indexOf(":");
    const environmentPart = colonIndex === -1 ? withoutEnv : withoutEnv.slice(0, colonIndex);
    const rest = colonIndex === -1 ? "" : withoutEnv.slice(colonIndex + 1);

    if (!isStorageExplorerEnvironment(environmentPart)) {
      return null;
    }

    const environment = environmentPart;

    if (!rest) {
      return { kind: "environment", environment };
    }

    return parseInnerNodeId(rest, environment);
  }

  const environment = resolveCurrentStorageExplorerEnvironment();
  return parseInnerNodeId(id, environment);
}

export function isStorageExplorerContainerNode(node: ParsedNodeId): boolean {
  return (
    node.kind === "all" ||
    node.kind === "environment" ||
    node.kind === "workspaces" ||
    node.kind === "platform" ||
    node.kind === "orphans"
  );
}

export function isStorageExplorerContainerNodeId(nodeId: string): boolean {
  const parsed = parseNodeId(nodeId);
  return parsed !== null && isStorageExplorerContainerNode(parsed);
}

export function buildWorkspaceNodeId(
  workspaceId: string,
  environment: StorageExplorerEnvironment = resolveCurrentStorageExplorerEnvironment(),
): string {
  return `env:${environment}:workspace:${workspaceId}`;
}

export function buildWorkspaceEstimateNodeId(
  workspaceId: string,
  estimateId: string,
  environment: StorageExplorerEnvironment = resolveCurrentStorageExplorerEnvironment(),
): string {
  return `env:${environment}:workspace:${workspaceId}:estimate:${estimateId}`;
}

export function buildPlatformIssueNodeId(
  issueId: string,
  environment: StorageExplorerEnvironment = resolveCurrentStorageExplorerEnvironment(),
): string {
  return `env:${environment}:platform:issue:${issueId}`;
}
