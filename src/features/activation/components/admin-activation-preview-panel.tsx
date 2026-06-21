"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ActivationPreviewRenderer } from "@/features/activation/components/activation-preview-renderers";
import {
  ACTIVATION_PREVIEW_CATALOG,
  ACTIVATION_PREVIEW_GROUP_IDS,
  DEFAULT_ACTIVATION_PREVIEW_ITEM_ID,
  type ActivationPreviewItemId,
} from "@/features/activation/lib/activation-preview-catalog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Locale } from "@/lib/locale";

interface AdminActivationPreviewPanelProps {
  pageLocale: Locale;
}

export function AdminActivationPreviewPanel({ pageLocale }: AdminActivationPreviewPanelProps) {
  const t = useTranslations("admin.activationPreview");
  const [selectedId, setSelectedId] = useState<ActivationPreviewItemId>(
    DEFAULT_ACTIVATION_PREVIEW_ITEM_ID,
  );

  const metaPrefix = `items.${selectedId}.meta` as const;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="max-w-xl space-y-2">
          <Label htmlFor="activation-preview-select">{t("selectLabel")}</Label>
          <select
            id="activation-preview-select"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value as ActivationPreviewItemId)}
          >
            {ACTIVATION_PREVIEW_GROUP_IDS.map((groupId) => (
              <optgroup key={groupId} label={t(`groups.${groupId}`)}>
                {ACTIVATION_PREVIEW_CATALOG.filter((item) => item.groupId === groupId).map(
                  (item) => (
                    <option key={item.id} value={item.id}>
                      {t(`items.${item.id}.label`)}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">{t("previewLabel")}</h2>
        <ActivationPreviewRenderer itemId={selectedId} locale={pageLocale} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">{t("metaLabel")}</h2>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">{t("tableHeaders.type")}</TableHead>
                <TableHead>{t("tableHeaders.what")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="align-top font-medium text-muted-foreground">
                  {t("tableHeaders.type")}
                </TableCell>
                <TableCell>{t(`${metaPrefix}.type`)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium text-muted-foreground">
                  {t("tableHeaders.what")}
                </TableCell>
                <TableCell>{t(`${metaPrefix}.what`)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium text-muted-foreground">
                  {t("tableHeaders.notes")}
                </TableCell>
                <TableCell className="text-muted-foreground">{t(`${metaPrefix}.notes`)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium text-muted-foreground">
                  {t("tableHeaders.when")}
                </TableCell>
                <TableCell>{t(`${metaPrefix}.when`)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="align-top font-medium text-muted-foreground">
                  {t("tableHeaders.frequency")}
                </TableCell>
                <TableCell>{t(`${metaPrefix}.frequency`)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
