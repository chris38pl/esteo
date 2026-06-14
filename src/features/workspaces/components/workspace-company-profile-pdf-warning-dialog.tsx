"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkspaceCompanyProfileField } from "@/features/workspaces/lib/company-profile-for-export";

interface WorkspaceCompanyProfilePdfWarningDialogProps {
  open: boolean;
  missingFields: WorkspaceCompanyProfileField[];
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  onGoToSettings: () => void;
}

export function WorkspaceCompanyProfilePdfWarningDialog({
  open,
  missingFields,
  onOpenChange,
  onProceed,
  onGoToSettings,
}: WorkspaceCompanyProfilePdfWarningDialogProps) {
  const t = useTranslations("estimates");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editor.pdfExport.companyProfileIncomplete.title")}</DialogTitle>
          <DialogDescription>{t("editor.pdfExport.companyProfileIncomplete.description")}</DialogDescription>
        </DialogHeader>

        {missingFields.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t("editor.pdfExport.companyProfileIncomplete.missingFieldsLabel")}
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {missingFields.map((field) => (
                <li key={field}>{t(`editor.pdfExport.companyProfileIncomplete.fields.${field}`)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:flex-col sm:items-stretch">
          <Button type="button" onClick={onGoToSettings}>
            {t("editor.pdfExport.companyProfileIncomplete.fillData")}
          </Button>
          <Button type="button" variant="outline" onClick={onProceed}>
            {t("editor.pdfExport.companyProfileIncomplete.proceedAnyway")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
