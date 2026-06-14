"use client";

import type { Issue, IssueAttachment } from "@prisma/client";
import { Copy, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { IssuePriorityBadge } from "@/features/issues/components/issue-priority-badge";
import { IssueStatusBadge } from "@/features/issues/components/issue-status-badge";
import { IssueTypeBadge } from "@/features/issues/components/issue-type-badge";
import { buildCursorPrompt } from "@/features/issues/lib/build-cursor-prompt";
import { buildIssueAdminUrl } from "@/features/issues/lib/build-issue-admin-url";
import { parseIssueContext } from "@/features/issues/lib/issue-context";
import {
  getIssueAttachmentSignedUrlAction,
  updateIssueStatusAction,
} from "@/features/issues/server/admin-actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/lib/locale";

function ScreenshotPreview({
  attachment,
  locale,
}: {
  attachment: IssueAttachment;
  locale: Locale;
}) {
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

  if (!url) {
    return (
      <div className="flex size-32 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
        …
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={attachment.originalFileName} className="size-32 object-cover" />
    </a>
  );
}

export function AdminIssueDetailPanel({
  issue,
  locale,
}: {
  issue: Issue & { attachments: IssueAttachment[] };
  locale: Locale;
}) {
  const t = useTranslations("issues");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"OPEN" | "RESOLVED">(
    issue.status === "RESOLVED" ? "RESOLVED" : "OPEN",
  );

  const context = parseIssueContext(issue.context);

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error(t("admin.copyFailed"));
    }
  }

  function handleStatusChange(nextStatus: "OPEN" | "RESOLVED") {
    setStatus(nextStatus);

    startTransition(async () => {
      const result = await updateIssueStatusAction(
        { number: issue.number, status: nextStatus },
        locale,
      );

      if (!result.success) {
        toast.error(result.error);
        setStatus(issue.status === "RESOLVED" ? "RESOLVED" : "OPEN");
        return;
      }

      router.refresh();
      toast.success(t("admin.statusUpdated"));
    });
  }

  return (
    <div className="space-y-6 md:max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-sm text-muted-foreground">#{issue.number}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{issue.title}</h1>
          <div className="flex flex-wrap gap-2">
            <IssueTypeBadge label={t(`type.${issue.type}`)} />
            <IssuePriorityBadge
              priority={issue.priority}
              label={t(`priority.${issue.priority}`)}
            />
            <IssueStatusBadge status={issue.status} label={t(`status.${issue.status}`)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyText(buildCursorPrompt(issue), t("admin.promptCopied"))}
          >
            <Copy className="size-4" />
            {t("admin.copyPrompt")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              copyText(
                buildIssueAdminUrl({
                  origin: window.location.origin,
                  locale,
                  number: issue.number,
                }),
                t("admin.urlCopied"),
              )
            }
          >
            <Link2 className="size-4" />
            {t("admin.copyUrl")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 text-sm">
          <p className="font-medium">{t("admin.metadata")}</p>
          <p className="text-muted-foreground">{t("admin.environment")}: {issue.environment}</p>
          <p className="text-muted-foreground">{t("admin.pageUrl")}: {issue.pageUrl}</p>
          <p className="text-muted-foreground">
            {t("admin.device")}: {issue.deviceType.toLowerCase()} ({issue.viewportWidth}×
            {issue.viewportHeight})
          </p>
          <p className="text-muted-foreground">
            {t("admin.context")}: {context ? JSON.stringify(context) : "—"}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("admin.status")}</p>
          <Select
            value={status}
            onValueChange={(value) => handleStatusChange(value as "OPEN" | "RESOLVED")}
            disabled={pending}
          >
            <SelectTrigger className="w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">{t("status.OPEN")}</SelectItem>
              <SelectItem value="RESOLVED">{t("status.RESOLVED")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">{t("admin.description")}</h2>
        <p className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-sm">{issue.description}</p>
      </section>

      {issue.reproductionSteps ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">{t("form.reproductionSteps")}</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{issue.reproductionSteps}</p>
        </section>
      ) : null}

      {issue.attachments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">{t("admin.screenshots")}</h2>
          <div className="flex flex-wrap gap-3">
            {issue.attachments.map((attachment) => (
              <ScreenshotPreview key={attachment.id} attachment={attachment} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
