"use client";

import { Download, ExternalLink, FileImage, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatBytes } from "@/features/attachments/lib/format-bytes";
import { getIssueAttachmentSignedUrlAction } from "@/features/issues/server/admin-actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type IssueDetailAttachment = {
  id: string;
  originalFileName: string;
  fileSizeBytes: number;
};

function IssueAttachmentTile({
  attachment,
  locale,
}: {
  attachment: IssueDetailAttachment;
  locale: Locale;
}) {
  const t = useTranslations("issues");
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getIssueAttachmentSignedUrlAction(attachment.id, locale).then((result) => {
      if (!cancelled && result.success) {
        setUrl(result.data.url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [attachment.id, locale]);

  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col rounded-xl border border-border/60 bg-card p-3 transition-colors",
        "hover:border-border",
      )}
    >
      <div className="absolute top-2.5 right-2.5 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-7 bg-card/90 text-muted-foreground shadow-xs hover:text-foreground"
              aria-label={t("admin.detail.fileActions")}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {url ? (
              <>
                <DropdownMenuItem asChild>
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    {t("admin.detail.openScreenshot")}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={url} download={attachment.originalFileName}>
                    <Download className="size-4" />
                    {t("admin.detail.download")}
                  </a>
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-3 flex h-20 items-center justify-center overflow-hidden rounded-lg bg-muted/25">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-xl bg-violet-500/10">
            <FileImage className="size-7 text-violet-500 dark:text-violet-400" aria-hidden />
          </div>
        )}
      </div>

      <p
        className="truncate text-center text-sm font-medium text-foreground"
        title={attachment.originalFileName}
      >
        {attachment.originalFileName}
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        {formatBytes(attachment.fileSizeBytes)}
      </p>
    </article>
  );
}

export function IssueDetailAttachments({
  attachments,
  locale,
}: {
  attachments: IssueDetailAttachment[];
  locale: Locale;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
      {attachments.map((attachment) => (
        <IssueAttachmentTile key={attachment.id} attachment={attachment} locale={locale} />
      ))}
    </div>
  );
}
