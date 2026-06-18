"use client";

import { FileSpreadsheet, FileText, MoreVertical, Presentation } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardPanelCard } from "@/features/dashboard/components/dashboard-panel-card";
import { DashboardRelativeTime } from "@/features/dashboard/components/dashboard-relative-time";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
import type {
  DashboardDocumentFileType,
  DashboardRecentDocumentItem,
} from "@/features/dashboard/lib/dashboard-overview-types";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface DashboardRecentDocumentsCardProps {
  items: DashboardRecentDocumentItem[];
  workspaceSlug: string;
  locale: Locale;
}

const FILE_TYPE_STYLES: Record<
  DashboardDocumentFileType,
  { icon: LucideIcon; bg: string; iconClassName: string }
> = {
  PDF: {
    icon: FileText,
    bg: "bg-red-500/10",
    iconClassName: "text-red-500 dark:text-red-400",
  },
  DOCX: {
    icon: FileText,
    bg: "bg-blue-500/10",
    iconClassName: "text-blue-500 dark:text-blue-400",
  },
  XLSX: {
    icon: FileSpreadsheet,
    bg: "bg-emerald-500/10",
    iconClassName: "text-emerald-500 dark:text-emerald-400",
  },
  PPTX: {
    icon: Presentation,
    bg: "bg-amber-500/10",
    iconClassName: "text-amber-500 dark:text-amber-400",
  },
};

export function DashboardRecentDocumentsCard({
  items,
  workspaceSlug,
  locale,
}: DashboardRecentDocumentsCardProps) {
  const t = useTranslations("dashboard.overview.documents");
  const documentsHref = `/${locale}/dashboard/${workspaceSlug}/workspace-usage`;

  return (
    <DashboardPanelCard
      title={t("title")}
      headerAction={
        <Link href={documentsHref} className="text-sm font-medium text-primary hover:underline">
          {t("seeAll")}
        </Link>
      }
      footer={
        <Button variant="outline" className="w-full" asChild>
          <Link href={documentsHref}>{t("footer")}</Link>
        </Button>
      }
    >
      <ul className="divide-y divide-border/60">
        {items.map((item) => {
          const styles = FILE_TYPE_STYLES[item.fileType];
          const Icon = styles.icon;

          return (
            <li key={item.id} className="flex items-center gap-3 px-5 py-4">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  styles.bg,
                )}
              >
                <Icon className={cn("size-5", styles.iconClassName)} aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.fileName}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.workspaceName}
                  <span className="mx-1.5 text-primary">♦</span>
                  {formatBytes(item.fileSizeBytes)}
                </p>
              </div>

              <DashboardRelativeTime
                value={item.occurredAt}
                locale={locale}
                className="hidden sm:block"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">{t("menu")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>{t("menuDownload")}</DropdownMenuItem>
                  <DropdownMenuItem disabled>{t("menuOpen")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>
    </DashboardPanelCard>
  );
}
