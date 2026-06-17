"use client";

import { Download, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { UserBillingInvoiceItem } from "@/features/users/server/get-user-billing-invoices";
import { formatDate } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";

interface UserBillingInvoiceRowProps {
  invoice: UserBillingInvoiceItem;
  locale: Locale;
  layout?: "table" | "list";
}

const iconClassName =
  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10";

export function UserBillingInvoiceRow({
  invoice,
  locale,
  layout = "table",
}: UserBillingInvoiceRowProps) {
  const t = useTranslations("billing.accountInvoices");
  const formattedDate = formatDate(invoice.createdAt, locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const downloadButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="size-8 shrink-0 rounded-md"
      disabled={!invoice.pdfUrl}
      aria-label={t("download")}
      asChild={invoice.pdfUrl ? true : undefined}
    >
      {invoice.pdfUrl ? (
        <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
          <Download className="size-4" />
        </a>
      ) : (
        <Download className="size-4 text-muted-foreground/40" />
      )}
    </Button>
  );

  const titleCell = (
    <div className="flex min-w-0 items-center gap-3">
      <span className={iconClassName}>
        <FileText className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold">{invoice.number}</p>
        {layout === "list" ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{formattedDate}</p>
        ) : null}
      </div>
    </div>
  );

  if (layout === "list") {
    return (
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-4">
        <div className="min-w-0 flex-1">{titleCell}</div>
        {downloadButton}
      </div>
    );
  }

  return (
    <tr className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3">{titleCell}</td>
      <td className="px-4 py-3">
        <p className="truncate font-medium tabular-nums">{formattedDate}</p>
      </td>
      <td className="px-2 py-3 text-right">{downloadButton}</td>
    </tr>
  );
}
