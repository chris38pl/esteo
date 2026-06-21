"use client";

import type { SearchEntityType, SearchIconType } from "@prisma/client";
import { ChevronRight, FileText, Lightbulb, MessageSquareQuote, Paperclip } from "lucide-react";

import { splitSearchHighlight } from "@/features/estimates/lib/split-search-highlight";
import { cn } from "@/lib/utils";

const ICON_STYLES: Record<SearchIconType, string> = {
  ESTIMATE: "text-emerald-500",
  REQUEST: "text-violet-500",
  FILE: "text-amber-500",
};

const GROUP_ICON_STYLES: Record<"estimates" | "inquiries" | "attachments" | "tips", string> = {
  estimates: "text-emerald-500",
  inquiries: "text-violet-500",
  attachments: "text-amber-500",
  tips: "text-amber-500",
};

export function SearchResultIcon({ iconType }: { iconType: SearchIconType }) {
  const className = cn("size-5 shrink-0", ICON_STYLES[iconType]);
  switch (iconType) {
    case "ESTIMATE":
      return <FileText className={className} strokeWidth={1.75} />;
    case "REQUEST":
      return <MessageSquareQuote className={className} strokeWidth={1.75} />;
    case "FILE":
      return <Paperclip className={className} strokeWidth={1.75} />;
    default:
      return <FileText className={className} strokeWidth={1.75} />;
  }
}

export function SearchGroupIcon({
  group,
}: {
  group: "estimates" | "inquiries" | "attachments" | "tips";
}) {
  const className = cn("size-4 shrink-0", GROUP_ICON_STYLES[group]);
  switch (group) {
    case "estimates":
      return <FileText className={className} strokeWidth={1.75} />;
    case "inquiries":
      return <MessageSquareQuote className={className} strokeWidth={1.75} />;
    case "attachments":
      return <Paperclip className={className} strokeWidth={1.75} />;
    case "tips":
      return <Lightbulb className={className} strokeWidth={1.75} />;
  }
}

export function TipSearchResultItemContent({
  title,
  subtitle,
  query,
}: {
  title: string;
  subtitle?: string;
  query?: string;
}) {
  const showHighlight = Boolean(query?.trim());

  return (
    <>
      <Lightbulb className="size-5 shrink-0 text-amber-500" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {showHighlight ? <HighlightedText text={title} query={query!} /> : title}
        </p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" strokeWidth={1.75} />
    </>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const parts = splitSearchHighlight(text, query);
  return (
    <span>
      {parts.map((part, index) =>
        part.match ? (
          <mark key={index} className="rounded-sm bg-primary/15 text-foreground">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </span>
  );
}

export function SearchResultItemContent({
  iconType,
  title,
  subtitle,
  query,
  showChevron = true,
}: {
  iconType: SearchIconType;
  title: string;
  subtitle?: string;
  query?: string;
  showChevron?: boolean;
}) {
  const showHighlight = Boolean(query?.trim());

  return (
    <>
      <SearchResultIcon iconType={iconType} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {showHighlight ? <HighlightedText text={title} query={query!} /> : title}
        </p>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {showChevron ? (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" strokeWidth={1.75} />
      ) : null}
    </>
  );
}

export function RecentDocumentRow({
  iconType,
  title,
  meta,
}: {
  iconType: SearchIconType;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-3.5">
      <SearchResultIcon iconType={iconType} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" strokeWidth={1.75} />
    </div>
  );
}

export function entityTypeLabel(
  t: (key: "entityTypes.estimate" | "entityTypes.inquiry" | "entityTypes.attachment") => string,
  entityType: SearchEntityType,
): string {
  switch (entityType) {
    case "ESTIMATE":
      return t("entityTypes.estimate");
    case "INQUIRY":
      return t("entityTypes.inquiry");
    case "ATTACHMENT":
      return t("entityTypes.attachment");
    default:
      return t("entityTypes.estimate");
  }
}
