"use client";

import { getFollowUpScopeBadgeStyle } from "@/features/voice-intake/lib/follow-up-scope-badge-style";
import { cn } from "@/lib/utils";

/** ~3 rows of compact, variable-width badges. */
const SCOPE_BADGES_MAX_HEIGHT = "6.5rem";

export function VoiceFollowUpScopeBadges({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return null;
  }

  return (
    <div
      className="sidebar-scroll w-full overflow-x-hidden overflow-y-auto pr-1"
      style={{ maxHeight: SCOPE_BADGES_MAX_HEIGHT }}
    >
      <ul className="flex flex-wrap justify-center gap-1.5">
        {labels.map((label) => {
          const { icon: Icon, color } = getFollowUpScopeBadgeStyle(label);

          return (
            <li key={label}>
              <span className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-lg border border-border/40 bg-card/65 px-2 py-1">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md",
                    color.box,
                  )}
                >
                  <Icon className={cn("size-2.5", color.icon)} aria-hidden />
                </span>
                <span className="whitespace-nowrap text-[0.6875rem] font-normal leading-tight text-foreground/75">
                  {label}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
