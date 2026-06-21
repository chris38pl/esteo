export type ParsedNodeId =
  | { kind: "all" }
  | { kind: "workspaces" }
  | { kind: "workspace"; workspaceId: string }
  | { kind: "workspace_estimates"; workspaceId: string }
  | { kind: "workspace_estimate"; workspaceId: string; estimateId: string }
  | { kind: "workspace_staging_active"; workspaceId: string }
  | { kind: "workspace_staging_linked"; workspaceId: string }
  | { kind: "workspace_pdfs"; workspaceId: string }
  | { kind: "workspace_logo"; workspaceId: string }
  | { kind: "platform" }
  | { kind: "platform_issues" }
  | { kind: "platform_issue"; issueId: string }
  | { kind: "orphans" }
  | { kind: "orphans_ut_only" }
  | { kind: "orphans_json_unpromoted" }
  | { kind: "orphans_legacy" }
  | { kind: "orphans_duplicate_keys" };

const DEFAULT_NODE_ID = "workspaces";

export function normalizeNodeId(nodeId: string | null | undefined): string {
  if (!nodeId || nodeId.trim().length === 0) {
    return DEFAULT_NODE_ID;
  }
  return nodeId.trim();
}

export function parseNodeId(nodeId: string): ParsedNodeId | null {
  const id = normalizeNodeId(nodeId);

  if (id === "all") return { kind: "all" };
  if (id === "workspaces") return { kind: "workspaces" };
  if (id === "platform") return { kind: "platform" };
  if (id === "platform:issues") return { kind: "platform_issues" };
  if (id === "orphans") return { kind: "orphans" };
  if (id === "orphans:ut-only") return { kind: "orphans_ut_only" };
  if (id === "orphans:json-unpromoted") return { kind: "orphans_json_unpromoted" };
  if (id === "orphans:legacy") return { kind: "orphans_legacy" };
  if (id === "orphans:duplicate-keys") return { kind: "orphans_duplicate_keys" };

  if (id.startsWith("platform:issue:")) {
    const issueId = id.slice("platform:issue:".length);
    if (issueId) return { kind: "platform_issue", issueId };
  }

  if (id.startsWith("workspace:")) {
    const rest = id.slice("workspace:".length);
    const parts = rest.split(":");

    if (parts.length === 1 && parts[0]) {
      return { kind: "workspace", workspaceId: parts[0] };
    }

    if (parts.length >= 2) {
      const workspaceId = parts[0];
      const section = parts[1];

      if (!workspaceId) return null;

      if (section === "estimates") {
        if (parts.length === 2) return { kind: "workspace_estimates", workspaceId };
        if (parts.length === 4 && parts[2] === "estimate" && parts[3]) {
          return { kind: "workspace_estimate", workspaceId, estimateId: parts[3] };
        }
      }

      if (section === "staging-active") return { kind: "workspace_staging_active", workspaceId };
      if (section === "staging-linked") return { kind: "workspace_staging_linked", workspaceId };
      if (section === "pdfs") return { kind: "workspace_pdfs", workspaceId };
      if (section === "logo") return { kind: "workspace_logo", workspaceId };
    }
  }

  return null;
}

export function buildWorkspaceNodeId(workspaceId: string): string {
  return `workspace:${workspaceId}`;
}

export function buildWorkspaceEstimateNodeId(workspaceId: string, estimateId: string): string {
  return `workspace:${workspaceId}:estimate:${estimateId}`;
}

export function buildPlatformIssueNodeId(issueId: string): string {
  return `platform:issue:${issueId}`;
}
