import { ChevronRight, Pin, PinOff, X } from "lucide-react";
import Link from "next/link";

import type { TipCardStyle } from "@/features/tips/lib/tip-card-styles";
import { cn } from "@/lib/utils";

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

  const hasActions = onDismiss != null || onPinToggle != null;

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border border-border/60 bg-muted/20 p-4 transition-[box-shadow,background-color,border-color] duration-200 md:p-5",
        isPinned && "border-primary/30 bg-primary/5 ring-2 ring-primary/20",
      )}
    >
      <div className="absolute right-3 top-3 flex items-center gap-1">
        {hasActions ? (
          <>
            {onPinToggle ? (
              <button
                type="button"
                onClick={onPinToggle}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-md transition-colors duration-200",
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
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                aria-label={dismissLabel}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </>
        ) : null}
        {index != null ? (
          <span
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-md text-xs font-semibold",
              badgeClassName,
            )}
          >
            {index}
          </span>
        ) : null}
      </div>

      <div className="mb-4 flex items-start justify-between gap-3 pr-16">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            iconWrapClassName,
          )}
        >
          <Icon className={cn("size-5", iconClassName)} aria-hidden />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {isPinned && pinnedBadgeLabel ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium leading-none text-primary ring-1 ring-primary/20">
              {pinnedBadgeLabel}
            </span>
          ) : null}
          {showCategory && categoryLabel ? (
            <span
              className={cn(
                "inline-flex max-w-[55%] items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
                categoryClassName,
              )}
            >
              {categoryLabel}
            </span>
          ) : null}
        </div>
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
