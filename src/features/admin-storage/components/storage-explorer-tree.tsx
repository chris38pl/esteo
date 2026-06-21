"use client";

import {
  Building2,
  ChevronRight,
  Cloud,
  Folder,
  FolderOpen,
  HardDrive,
  Layers,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import type { StorageExplorerTreeNode } from "@/features/admin-storage/lib/storage-explorer-types";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function nodeIcon(node: StorageExplorerTreeNode, expanded: boolean) {
  if (node.kind === "environment") return Cloud;
  if (node.kind === "workspace") return Building2;
  if (node.kind === "estimate" || node.kind === "issue") return HardDrive;
  if (node.kind === "category") return HardDrive;
  if (node.kind === "group") return Layers;
  return expanded ? FolderOpen : Folder;
}

function TreeNodeRow({
  node,
  depth,
  selectedNodeId,
  expandedIds,
  onToggleExpand,
  onSelect,
  labelForNode,
}: {
  node: StorageExplorerTreeNode;
  depth: number;
  selectedNodeId: string;
  expandedIds: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  labelForNode: (node: StorageExplorerTreeNode) => string;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const expanded = expandedIds.has(node.id);
  const selected = selectedNodeId === node.id;
  const Icon = nodeIcon(node, expanded);

  return (
    <>
      <div
        className={cn(
          "flex min-w-0 items-center gap-1 rounded-md py-1 pr-2 text-sm",
          selected ? "bg-accent text-accent-foreground" : "hover:bg-muted/60",
          node.isCurrentEnvironment && node.kind === "environment" && "ring-1 ring-primary/20",
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          aria-label={hasChildren ? (expanded ? "Collapse" : "Expand") : undefined}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-sm",
            hasChildren ? "hover:bg-muted" : "pointer-events-none opacity-0",
          )}
          onClick={() => hasChildren && onToggleExpand(node.id)}
        >
          <ChevronRight
            className={cn("size-3.5 transition-transform", expanded && "rotate-90")}
          />
        </button>

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => onSelect(node.id)}
        >
          <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <span className="truncate font-medium">{labelForNode(node)}</span>
        </button>

        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
          {node.stats.fileCount}
          {BigInt(node.stats.totalBytes) > BigInt(0)
            ? ` · ${formatBytes(BigInt(node.stats.totalBytes))}`
            : ""}
        </span>
      </div>

      {hasChildren && expanded
        ? node.children!.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              labelForNode={labelForNode}
            />
          ))
        : null}
    </>
  );
}

export function StorageExplorerTree({
  tree,
  selectedNodeId,
  onSelectNode,
  currentEnvironment,
}: {
  tree: StorageExplorerTreeNode;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  currentEnvironment: string;
}) {
  const t = useTranslations("admin.storageExplorer.tree");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const envPrefix = `env:${currentEnvironment}:`;
    return new Set([
      "all",
      `env:${currentEnvironment}`,
      `${envPrefix}workspaces`,
      `${envPrefix}platform`,
      `${envPrefix}orphans`,
    ]);
  });

  const labelForNode = (node: StorageExplorerTreeNode): string => {
    if (node.kind === "root") return t("all");
    if (node.kind === "environment") {
      const envLabel = t(`environments.${node.label as "development" | "staging" | "production"}`);
      return node.isCurrentEnvironment ? `${envLabel} ${t("currentEnvironment")}` : envLabel;
    }
    if (node.kind === "group") {
      if (node.label === "workspaces") return t("workspaces");
      if (node.label === "platform") return t("platform");
      if (node.label === "orphans") return t("orphans");
    }
    if (node.kind === "category") {
      const key = node.label as
        | "estimates"
        | "stagingActive"
        | "stagingLinked"
        | "pdfs"
        | "logo"
        | "issues"
        | "utOnly"
        | "jsonUnpromoted"
        | "legacy"
        | "duplicateKeys";
      return t(`categories.${key}`);
    }
    return node.label;
  };

  const filteredTree = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tree;

    function filterNode(node: StorageExplorerTreeNode): StorageExplorerTreeNode | null {
      const label = labelForNode(node).toLowerCase();
      const selfMatch = label.includes(query) || node.id.toLowerCase().includes(query);
      const filteredChildren =
        node.children
          ?.map((child) => filterNode(child))
          .filter((child): child is StorageExplorerTreeNode => child !== null) ?? [];

      if (selfMatch || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }

      return null;
    }

    return filterNode(tree) ?? tree;
  }, [search, tree, t]);

  const toggleExpand = (nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t("searchPlaceholder")}
        className="h-8 text-sm"
      />

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-1">
        <TreeNodeRow
          node={filteredTree}
          depth={0}
          selectedNodeId={selectedNodeId}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
          onSelect={onSelectNode}
          labelForNode={labelForNode}
        />
      </div>
    </div>
  );
}
