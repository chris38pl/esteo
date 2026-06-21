import { ChevronRight, Pin, PinOff, X } from "lucide-react";
import Link from "next/link";

import type { TipCardStyle } from "@/features/tips/lib/tip-card-styles";
import { cn } from "@/lib/utils";

const metaBadgeClassName =
  "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium leading-none whitespace-nowrap";

const actionButtonClassName =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200";

export function TipCard({
  title,
  description,
  learnMoreLabel,
  href,
  style,
  index,
  categoryLabel,
  showCategory = false,
  isPinned = false,
  pinnedBadgeLabel,
  onDismiss,
  dismissLabel,
  onPinToggle,
  pinLabel,
  unpinLabel,
}: {
  title: string;
  description: string;
  learnMoreLabel: string;
  href: string;
  style: TipCardStyle;
  index?: number;
  categoryLabel?: string;
  showCategory?: boolean;
  isPinned?: boolean;
  pinnedBadgeLabel?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
  onPinToggle?: () => void;
  pinLabel?: string;
  unpinLabel?: string;
}) {
  const { Icon, badgeClassName, iconWrapClassName, iconClassName, linkClassName, categoryClassName } =
    style;

  const showMetaRow =
    (showCategory && categoryLabel) ||
    (isPinned && pinnedBadgeLabel) ||
    onPinToggle != null ||
    (onDismiss != null && !isPinned) ||
    index != null;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border border-border/60 bg-muted/20 p-4 transition-[box-shadow,background-color,border-color] duration-200 md:p-5",
        isPinned && "border-primary/30 bg-primary/5 ring-2 ring-primary/20",
      )}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            iconWrapClassName,
          )}
        >
          <Icon className={cn("size-5", iconClassName)} aria-hidden />
        </div>

        {showMetaRow ? (
          <div className="ml-auto flex min-w-0 max-w-[calc(100%-3.25rem)] flex-wrap items-center justify-end gap-1.5">
            {showCategory && categoryLabel ? (
              <span className={cn(metaBadgeClassName, categoryClassName)}>{categoryLabel}</span>
            ) : null}
            {isPinned && pinnedBadgeLabel ? (
              <span
                className={cn(
                  metaBadgeClassName,
                  "bg-primary/10 text-primary ring-1 ring-primary/20",
                )}
              >
                {pinnedBadgeLabel}
              </span>
            ) : null}
            {onPinToggle ? (
              <button
                type="button"
                onClick={onPinToggle}
                className={cn(
                  actionButtonClassName,
                  isPinned
                    ? "bg-primary/15 text-primary ring-1 ring-primary/25 hover:bg-primary/20"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
                aria-label={isPinned ? unpinLabel : pinLabel}
                aria-pressed={isPinned}
              >
                {isPinned ? (
                  <PinOff className="size-3.5" aria-hidden />
                ) : (
                  <Pin className="size-3.5" aria-hidden />
                )}
              </button>
            ) : null}
            {onDismiss && !isPinned ? (
              <button
                type="button"
                onClick={onDismiss}
                className={cn(
                  actionButtonClassName,
                  "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
                aria-label={dismissLabel}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
            {index != null ? (
              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                  badgeClassName,
                )}
              >
                {index}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <h3 className="text-sm font-semibold leading-snug text-foreground">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>

      <Link
        href={href}
        className={cn(
          "mt-4 inline-flex items-center gap-1 text-sm font-medium transition-colors",
          linkClassName,
        )}
      >
        {learnMoreLabel}
        <ChevronRight className="size-4 shrink-0" aria-hidden />
      </Link>
    </article>
  );
}
