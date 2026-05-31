"use client";

import { WorkspaceAppearanceTheme } from "@prisma/client";
import { useState } from "react";

import { WorkspaceCreateShell } from "@/components/workspaces/workspace-create-shell";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { WorkspaceThemePicker } from "@/features/workspaces/components/workspace-theme-picker";
import type { Locale } from "@/lib/locale";

type CreateWorkspacePanelMode = "onboarding" | "new";
type CreateWorkspacePanelLayout = "fullscreen" | "embedded";

export function CreateWorkspacePanel({
  locale,
  mode,
  layout = "fullscreen",
}: {
  locale: Locale;
  mode: CreateWorkspacePanelMode;
  layout?: CreateWorkspacePanelLayout;
}) {
  const [appearanceTheme, setAppearanceTheme] = useState<WorkspaceAppearanceTheme>(
    WorkspaceAppearanceTheme.OCEAN_BREEZE,
  );
  const [themePickerDisabled, setThemePickerDisabled] = useState(false);

  return (
    <WorkspaceCreateShell
      mode={mode}
      layout={layout}
      headerTrailing={
        <WorkspaceThemePicker
          variant="header"
          value={appearanceTheme}
          onChange={setAppearanceTheme}
          disabled={themePickerDisabled}
        />
      }
    >
      <CreateWorkspaceForm
        locale={locale}
        mode={mode}
        appearanceTheme={appearanceTheme}
        onPendingChange={setThemePickerDisabled}
      />
    </WorkspaceCreateShell>
  );
}
