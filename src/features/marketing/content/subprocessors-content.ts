import {
  getSubprocessorTableRows,
  legalLastUpdated,
  subprocessorsPageCopy,
} from "@/features/marketing/content/legal.config";
import type { Locale } from "@/lib/locale";

export type SubprocessorsPageContent = {
  pageTitle: string;
  pageDescription: string;
  breadcrumbLabel: string;
  lastUpdated: string;
  introParagraph: string;
  tableHeaders: [string, string, string];
  tableRows: string[][];
  footnoteScope: string;
  footnoteUpdates: string;
};

export function getSubprocessorsPageContent(locale: Locale): SubprocessorsPageContent {
  const copy = subprocessorsPageCopy[locale];

  return {
    pageTitle: copy.pageTitle,
    pageDescription: copy.pageDescription,
    breadcrumbLabel: copy.breadcrumbLabel,
    lastUpdated: legalLastUpdated[locale],
    introParagraph: copy.introParagraph,
    tableHeaders: copy.tableHeaders,
    tableRows: getSubprocessorTableRows(locale),
    footnoteScope: copy.footnoteScope,
    footnoteUpdates: copy.footnoteUpdates,
  };
}
