"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DeleteWorkspaceDialog } from "@/features/workspaces/components/delete-workspace-dialog";
import type { Locale } from "@/lib/locale";

export function WorkspaceSettingsDeleteSection({
  workspaceId,
  workspaceName,
  locale,
}: {
  workspaceId: string;
  workspaceName: string;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings.delete");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="mt-10 border-t border-border/60 pt-8">
        <h2 className="text-base font-semibold tracking-tight text-destructive">
          {t("sectionTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("sectionDescription")}</p>

        <Button
          type="button"
          variant="destructive"
          className="mt-4 rounded-lg"
          onClick={() => setDialogOpen(true)}
        >
          {t("deleteButton")}
        </Button>
      </div>

      <DeleteWorkspaceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        locale={locale}
      />
    </>
  );
}
