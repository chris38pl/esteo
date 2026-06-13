"use client";

import type {
  BusinessDocumentType,
  IndustryFieldDefinition,
  IndustryFieldTranslation,
  IndustryFieldValueType,
  WorkspaceIndustry,
  WorkspaceLocale,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FIELD_CATALOG_INDUSTRIES } from "@/features/workspaces/lib/industries";
import {
  createIndustryFieldDefinitionAction,
  listIndustryFieldDefinitionsAction,
  updateIndustryFieldDefinitionAction,
} from "@/features/industry-fields/server/admin-actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type FieldDefinitionWithTranslations = IndustryFieldDefinition & {
  translations: IndustryFieldTranslation[];
};

type TranslationDraft = {
  locale: WorkspaceLocale;
  label: string;
  description: string;
  placeholder: string;
};

const DOCUMENT_TYPES: BusinessDocumentType[] = ["ESTIMATE_REQUEST", "ESTIMATE"];
const VALUE_TYPES: IndustryFieldValueType[] = ["TEXT", "NUMBER", "DATE", "BOOLEAN", "SELECT"];

const selectClassName = cn(
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

function emptyTranslations(): TranslationDraft[] {
  return [
    { locale: "PL", label: "", description: "", placeholder: "" },
    { locale: "EN", label: "", description: "", placeholder: "" },
  ];
}

function translationsFromDefinition(definition?: FieldDefinitionWithTranslations): TranslationDraft[] {
  const base = emptyTranslations();

  if (!definition) {
    return base;
  }

  return base.map((draft) => {
    const existing = definition.translations.find((translation) => translation.locale === draft.locale);
    return {
      locale: draft.locale,
      label: existing?.label ?? "",
      description: existing?.description ?? "",
      placeholder: existing?.placeholder ?? "",
    };
  });
}

function translationLabel(
  definition: FieldDefinitionWithTranslations,
  locale: WorkspaceLocale,
): string {
  return (
    definition.translations.find((translation) => translation.locale === locale)?.label ??
    "—"
  );
}

export function IndustryFieldsAdminPanel({
  locale,
  initialIndustry,
  initialDocumentType,
  initialDefinitions,
}: {
  locale: Locale;
  initialIndustry: WorkspaceIndustry;
  initialDocumentType: BusinessDocumentType;
  initialDefinitions: FieldDefinitionWithTranslations[];
}) {
  const t = useTranslations("admin.industryFields");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [industry, setIndustry] = useState(initialIndustry);
  const [documentType, setDocumentType] = useState(initialDocumentType);
  const [definitions, setDefinitions] = useState(initialDefinitions);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FieldDefinitionWithTranslations | null>(null);
  const [key, setKey] = useState("");
  const [valueType, setValueType] = useState<IndustryFieldValueType>("TEXT");
  const [sortOrder, setSortOrder] = useState(0);
  const [required, setRequired] = useState(false);
  const [active, setActive] = useState(true);
  const [optionsJson, setOptionsJson] = useState("");
  const [translations, setTranslations] = useState<TranslationDraft[]>(emptyTranslations());

  useEffect(() => {
    setIndustry(initialIndustry);
    setDocumentType(initialDocumentType);
    setDefinitions(initialDefinitions);
  }, [initialIndustry, initialDocumentType, initialDefinitions]);

  const isEstimateTabDisabled = documentType === "ESTIMATE";

  const sortedDefinitions = useMemo(
    () => [...definitions].sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key)),
    [definitions],
  );

  function openCreateDialog() {
    setEditing(null);
    setKey("");
    setValueType("TEXT");
    setSortOrder(definitions.length);
    setRequired(false);
    setActive(true);
    setOptionsJson("");
    setTranslations(emptyTranslations());
    setError(null);
    setDialogOpen(true);
  }

  function openEditDialog(definition: FieldDefinitionWithTranslations) {
    setEditing(definition);
    setKey(definition.key);
    setValueType(definition.valueType);
    setSortOrder(definition.sortOrder);
    setRequired(definition.required);
    setActive(definition.active);
    setOptionsJson(definition.options ? JSON.stringify(definition.options, null, 2) : "");
    setTranslations(translationsFromDefinition(definition));
    setError(null);
    setDialogOpen(true);
  }

  function updateFilters(
    nextIndustry: WorkspaceIndustry,
    nextDocumentType: BusinessDocumentType,
  ) {
    setIndustry(nextIndustry);
    setDocumentType(nextDocumentType);
    setError(null);

    startTransition(async () => {
      const result = await listIndustryFieldDefinitionsAction(
        { industry: nextIndustry, documentType: nextDocumentType },
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      setDefinitions(result.data);
      router.replace(
        `/${locale}/dashboard/admin/industry-fields?industry=${nextIndustry}&documentType=${nextDocumentType}`,
      );
    });
  }

  function handleSave() {
    setError(null);

    let options: unknown = undefined;

    if (valueType === "SELECT") {
      try {
        options = optionsJson.trim() ? JSON.parse(optionsJson) : [];
      } catch {
        setError(t("errors.invalidOptionsJson"));
        return;
      }
    }

    startTransition(async () => {
      if (editing) {
        const result = await updateIndustryFieldDefinitionAction(
          {
            id: editing.id,
            sortOrder,
            required,
            active,
            options: valueType === "SELECT" ? (options as never) : null,
            translations: translations.map((translation) => ({
              locale: translation.locale,
              label: translation.label,
              description: translation.description || null,
              placeholder: translation.placeholder || null,
            })),
          },
          locale,
        );

        if (!result.success) {
          setError(result.error);
          return;
        }

        setDefinitions((current) =>
          current.map((item) => (item.id === editing.id ? result.data : item)),
        );
      } else {
        const result = await createIndustryFieldDefinitionAction(
          {
            industry,
            documentType,
            key,
            valueType,
            sortOrder,
            required,
            active,
            options: valueType === "SELECT" ? (options as never) : null,
            translations: translations.map((translation) => ({
              locale: translation.locale,
              label: translation.label,
              description: translation.description || null,
              placeholder: translation.placeholder || null,
            })),
          },
          locale,
        );

        if (!result.success) {
          setError(result.error);
          return;
        }

        setDefinitions((current) => [...current, result.data]);
      }

      setDialogOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {DOCUMENT_TYPES.map((type) => {
          const disabled = type === "ESTIMATE";

          return (
            <Button
              key={type}
              type="button"
              variant={documentType === type ? "default" : "outline"}
              size="sm"
              disabled={disabled}
              onClick={() => updateFilters(industry, type)}
            >
              {t(`documentTypes.${type}`)}
              {disabled ? (
                <Badge variant="secondary" className="ml-2">
                  {t("soon")}
                </Badge>
              ) : null}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[220px] space-y-2">
          <Label htmlFor="industry-filter">{t("filters.industry")}</Label>
          <select
            id="industry-filter"
            value={industry}
            onChange={(event) => {
              updateFilters(event.target.value as WorkspaceIndustry, documentType);
            }}
            className={selectClassName}
          >
            {FIELD_CATALOG_INDUSTRIES.map((value) => (
              <option key={value} value={value}>
                {t(`industries.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <Button type="button" onClick={openCreateDialog} disabled={isEstimateTabDisabled || isPending}>
          {t("actions.create")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.key")}</TableHead>
            <TableHead>{t("table.valueType")}</TableHead>
            <TableHead>{t("table.labelPl")}</TableHead>
            <TableHead>{t("table.labelEn")}</TableHead>
            <TableHead>{t("table.required")}</TableHead>
            <TableHead>{t("table.sortOrder")}</TableHead>
            <TableHead>{t("table.active")}</TableHead>
            <TableHead className="text-right">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDefinitions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                {t("empty")}
              </TableCell>
            </TableRow>
          ) : (
            sortedDefinitions.map((definition) => (
              <TableRow key={definition.id}>
                <TableCell className="font-mono text-xs">{definition.key}</TableCell>
                <TableCell>{definition.valueType}</TableCell>
                <TableCell>{translationLabel(definition, "PL")}</TableCell>
                <TableCell>{translationLabel(definition, "EN")}</TableCell>
                <TableCell>{definition.required ? t("yes") : t("no")}</TableCell>
                <TableCell>{definition.sortOrder}</TableCell>
                <TableCell>{definition.active ? t("yes") : t("no")}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(definition)}
                  >
                    {t("actions.edit")}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t("dialog.editTitle") : t("dialog.createTitle")}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            {!editing ? (
              <div className="space-y-2">
                <Label htmlFor="field-key">{t("dialog.key")}</Label>
                <Input
                  id="field-key"
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  placeholder="property_type"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("dialog.key")}: <span className="font-mono">{key}</span>
              </p>
            )}

            {!editing ? (
              <div className="space-y-2">
                <Label htmlFor="field-value-type">{t("dialog.valueType")}</Label>
                <select
                  id="field-value-type"
                  value={valueType}
                  onChange={(event) => setValueType(event.target.value as IndustryFieldValueType)}
                  className={selectClassName}
                >
                  {VALUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("dialog.valueType")}: {valueType}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="field-sort-order">{t("dialog.sortOrder")}</Label>
                <DecimalInput
                  id="field-sort-order"
                  min={0}
                  max={9999}
                  decimalPlaces={0}
                  emptyZero={false}
                  value={sortOrder}
                  onValueChange={setSortOrder}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="field-required">{t("dialog.required")}</Label>
                <Switch id="field-required" checked={required} onCheckedChange={setRequired} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
                <Label htmlFor="field-active">{t("dialog.active")}</Label>
                <Switch id="field-active" checked={active} onCheckedChange={setActive} />
              </div>
            </div>

            {valueType === "SELECT" ? (
              <div className="space-y-2">
                <Label htmlFor="field-options">{t("dialog.optionsJson")}</Label>
                <textarea
                  id="field-options"
                  value={optionsJson}
                  onChange={(event) => setOptionsJson(event.target.value)}
                  rows={5}
                  className={cn(selectClassName, "h-auto py-2 font-mono text-xs")}
                  placeholder={'[{"value":"house","labelKey":"house"}]'}
                />
              </div>
            ) : null}

            {translations.map((translation, index) => (
              <div key={translation.locale} className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">{t(`locales.${translation.locale}`)}</p>
                <div className="space-y-2">
                  <Label>{t("dialog.label")}</Label>
                  <Input
                    value={translation.label}
                    onChange={(event) => {
                      const next = [...translations];
                      next[index] = { ...translation, label: event.target.value };
                      setTranslations(next);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("dialog.description")}</Label>
                  <Input
                    value={translation.description}
                    onChange={(event) => {
                      const next = [...translations];
                      next[index] = { ...translation, description: event.target.value };
                      setTranslations(next);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("dialog.placeholder")}</Label>
                  <Input
                    value={translation.placeholder}
                    onChange={(event) => {
                      const next = [...translations];
                      next[index] = { ...translation, placeholder: event.target.value };
                      setTranslations(next);
                    }}
                  />
                </div>
              </div>
            ))}

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t("actions.cancel")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={isPending}>
              {isPending ? t("actions.saving") : t("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
