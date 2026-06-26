"use client";

import { WorkspaceCreateShell } from "@/components/workspaces/workspace-create-shell";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import type { Locale } from "@/lib/locale";

type CreateWorkspacePanelMode = "onboarding" | "new";
type CreateWorkspacePanelLayout = "fullscreen" | "embedded";

export function CreateWorkspacePanel({
  locale,
  mode,
  layout = "fullscreen",
  freeSlotTaken = false,
  manageFreeWorkspaceSlug = null,
}: {
  locale: Locale;
  mode: CreateWorkspacePanelMode;
  layout?: CreateWorkspacePanelLayout;
  freeSlotTaken?: boolean;
  manageFreeWorkspaceSlug?: string | null;
}) {
  return (
    <WorkspaceCreateShell mode={mode} layout={layout}>
      <CreateWorkspaceForm
        locale={locale}
        mode={mode}
        freeSlotTaken={freeSlotTaken}
        manageFreeWorkspaceSlug={manageFreeWorkspaceSlug}
      />
    </WorkspaceCreateShell>
  );
}
