"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, FileText } from "lucide-react";

import type { EstimateAttachmentClient } from "@/features/attachments/lib/serialize-attachments";
import { getAttachmentSignedUrlAction } from "@/features/attachments/server/attachments-actions";
import type { EstimateForEditorClient } from "@/features/estimates/lib/serialize-estimate";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import { EstimateSummaryCardShell } from "./estimate-summary-card-shell";
import { EstimateSummarySectionHeader } from "./estimate-summary-section-header";

const VISIBLE_THUMBNAIL_LIMIT = 4;

interface EstimateSummaryBriefCardProps {
  estimate: EstimateForEditorClient;
  attachments: EstimateAttachmentClient[];
  locale: Locale;
}

export function EstimateSummaryBriefCard({
  estimate,
  attachments,
  locale,
}: EstimateSummaryBriefCardProps) {
  const t = useTranslations("estimates");
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const loadedThumbnailIdsRef = useRef<Set<string>>(new Set());

  const description = estimate.estimateRequest?.projectDescription?.trim() ?? "";
  const previewAttachments = useMemo(
    () =>
      [...attachments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [attachments],
  );

  const visibleAttachments = useMemo(
    () => previewAttachments.slice(0, VISIBLE_THUMBNAIL_LIMIT),
    [previewAttachments],
  );

  const visibleAttachmentIds = useMemo(
    () => visibleAttachments.map((attachment) => attachment.id).join(","),
    [visibleAttachments],
  );

  const hiddenCount = Math.max(0, previewAttachments.length - VISIBLE_THUMBNAIL_LIMIT);

  const updateClampedState = useCallback(() => {
    const element = descriptionRef.current;
    if (!element || expanded || !description) {
      setIsClamped(false);
      return;
    }

    setIsClamped(element.scrollHeight > element.clientHeight + 1);
  }, [description, expanded]);

  useEffect(() => {
    updateClampedState();
  }, [updateClampedState]);

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateClampedState();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [updateClampedState]);

  useEffect(() => {
    const attachmentsToPreview = previewAttachments.slice(0, VISIBLE_THUMBNAIL_LIMIT);
    const imageAttachments = attachmentsToPreview.filter(
      (attachment) =>
        attachment.attachmentType === "IMAGE" &&
        !loadedThumbnailIdsRef.current.has(attachment.id),
    );

    if (imageAttachments.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      imageAttachments.map(async (attachment) => {
        try {
          const result = await getAttachmentSignedUrlAction({
            attachmentId: attachment.id,
            estimateId: estimate.id,
            workspaceId: estimate.workspaceId,
            locale,
            variant: attachment.hasThumbnail ? "thumbnail" : "original",
          });

          if (!result.success) {
            return null;
          }

          return [attachment.id, result.data.url] as const;
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      if (cancelled) {
        return;
      }

      const fetched = Object.fromEntries(
        entries.filter((entry): entry is [string, string] => entry != null),
      );

      if (Object.keys(fetched).length === 0) {
        return;
      }

      for (const id of Object.keys(fetched)) {
        loadedThumbnailIdsRef.current.add(id);
      }

      setThumbnailUrls((previous) => ({ ...previous, ...fetched }));
    });

    return () => {
      cancelled = true;
    };
  }, [estimate.id, estimate.workspaceId, locale, visibleAttachmentIds]);

  const showToggle = expanded || isClamped;

  return (
    <EstimateSummaryCardShell>
      <EstimateSummarySectionHeader
        icon={FileText}
        title={t("editor.summary.brief.title")}
      />

      <div className="space-y-4 border-t border-border/60 px-5 py-4">
        {description ? (
          <div className="space-y-2">
            <p
              ref={descriptionRef}
              className={cn(
                "text-sm leading-relaxed text-foreground",
                !expanded && "line-clamp-5 lg:line-clamp-4",
              )}
            >
              {description}
            </p>

            {showToggle ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {expanded
                  ? t("editor.summary.brief.showLess")
                  : t("editor.summary.brief.showMore")}
                <ChevronDown
                  className={cn("size-4 transition-transform", expanded && "rotate-180")}
                />
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("editor.summary.brief.empty")}</p>
        )}

        {previewAttachments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleAttachments.map((attachment) => {
              const thumbnailUrl = thumbnailUrls[attachment.id];
              const isImage = attachment.attachmentType === "IMAGE";

              return (
                <div
                  key={attachment.id}
                  className="size-16 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted/30"
                >
                  {isImage && thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbnailUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <FileText className="size-5" />
                    </div>
                  )}
                </div>
              );
            })}

            {hiddenCount > 0 ? (
              <div
                className={cn(
                  "flex size-16 shrink-0 items-center justify-center rounded-lg",
                  "border border-border/70 bg-muted/40 text-sm font-semibold text-muted-foreground",
                )}
              >
                +{hiddenCount}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </EstimateSummaryCardShell>
  );
}
