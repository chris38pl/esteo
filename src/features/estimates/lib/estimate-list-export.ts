import type { EstimateVersionStatus } from "@prisma/client";

import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";

export type EstimateListCsvColumnLabels = {
  estimateName: string;
  workspace?: string;
  owner?: string;
  inquiry: string;
  investment: string;
  client: string;
  updated: string;
  value: string;
  status: string;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatExportDate(value: Date, locale: Locale): string {
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";
  return new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function toCurrency(code: string): Currency {
  return code === "EUR" ? "EUR" : "PLN";
}

function estimateToCsvCells(
  estimate: EstimateListPageItem,
  locale: Locale,
  statusLabel: (status: EstimateVersionStatus) => string,
  options?: { includeWorkspace?: boolean; workspaceName?: string; ownerLabel?: string },
): string[] {
  const latest = estimate.latestVersion;
  const request = estimate.estimateRequest;
  const ctx = estimate.listContext;
  const title = estimate.title ?? `Estimate ${estimate.id.slice(-6)}`;
  const gross = latest ? Number(latest.totalGross) : 0;
  const updatedAt = latest?.updatedAt ?? estimate.createdAt;
  const investment = [
    ctx.investmentPropertyType,
    [ctx.investmentStreet, ctx.investmentCity].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" — ");
  const client = [ctx.customerName, ctx.customerEmail].filter(Boolean).join(" / ");

  const baseCells = [
    title,
    request?.requestNumber ?? "",
    investment,
    client,
    formatExportDate(updatedAt, locale),
    formatCurrency(gross, locale, toCurrency(estimate.currency)),
    latest?.status ? statusLabel(latest.status) : "",
  ];

  if (options?.includeWorkspace) {
    return [
      title,
      options.workspaceName ?? "",
      options.ownerLabel ?? "",
      ...baseCells.slice(1),
    ];
  }

  return baseCells;
}

export function buildEstimatesListCsv(
  estimates: EstimateListPageItem[],
  labels: EstimateListCsvColumnLabels,
  locale: Locale,
  statusLabel: (status: EstimateVersionStatus) => string,
  options?: {
    includeWorkspace?: boolean;
    workspaceByEstimateId?: Map<string, { workspaceName: string; ownerLabel: string }>;
  },
): string {
  const header = options?.includeWorkspace
    ? [
        labels.estimateName,
        labels.workspace ?? "Workspace",
        labels.owner ?? "Owner",
        labels.inquiry,
        labels.investment,
        labels.client,
        labels.updated,
        labels.value,
        labels.status,
      ]
    : [
        labels.estimateName,
        labels.inquiry,
        labels.investment,
        labels.client,
        labels.updated,
        labels.value,
        labels.status,
      ];

  const rows = estimates.map((estimate) => {
    const workspaceMeta = options?.workspaceByEstimateId?.get(estimate.id);
    return estimateToCsvCells(estimate, locale, statusLabel, {
      includeWorkspace: options?.includeWorkspace,
      workspaceName: workspaceMeta?.workspaceName,
      ownerLabel: workspaceMeta?.ownerLabel,
    })
      .map(escapeCsvCell)
      .join(",");
  });

  return [header.map(escapeCsvCell).join(","), ...rows].join("\r\n");
}

export function downloadEstimatesListCsv(csv: string, filePrefix: string): void {
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `${filePrefix}-${date}.csv`;
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
