import type { LucideIcon } from "lucide-react";
import {
  DoorOpen,
  Droplets,
  Grid3x3,
  Hammer,
  Home,
  Layers,
  Paintbrush,
  Ruler,
  Wrench,
  Zap,
} from "lucide-react";

export const FOLLOW_UP_SCOPE_BADGE_ICONS: LucideIcon[] = [
  Hammer,
  Paintbrush,
  Droplets,
  Zap,
  Home,
  Layers,
  Grid3x3,
  DoorOpen,
  Ruler,
  Wrench,
];

export const FOLLOW_UP_SCOPE_BADGE_COLORS = [
  {
    icon: "text-sky-500 dark:text-sky-400",
    box: "bg-sky-500/15",
  },
  {
    icon: "text-violet-500 dark:text-violet-400",
    box: "bg-violet-500/15",
  },
  {
    icon: "text-orange-500 dark:text-orange-400",
    box: "bg-orange-500/15",
  },
  {
    icon: "text-teal-500 dark:text-teal-400",
    box: "bg-teal-500/15",
  },
  {
    icon: "text-amber-500 dark:text-amber-400",
    box: "bg-amber-500/15",
  },
] as const;

function hashLabel(label: string): number {
  let hash = 0;
  const normalized = label.trim().toLowerCase();

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

export function getFollowUpScopeBadgeStyle(label: string) {
  const hash = hashLabel(label);
  const icon = FOLLOW_UP_SCOPE_BADGE_ICONS[hash % FOLLOW_UP_SCOPE_BADGE_ICONS.length]!;
  const color = FOLLOW_UP_SCOPE_BADGE_COLORS[hash % FOLLOW_UP_SCOPE_BADGE_COLORS.length]!;

  return { icon, color };
}
