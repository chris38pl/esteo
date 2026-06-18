"use client";

import { useEffect, useState } from "react";

import { formatRelativeAgo } from "@/features/dashboard/lib/format-relative-ago";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface DashboardRelativeTimeProps {
  value: string;
  locale: Locale;
  className?: string;
}

export function DashboardRelativeTime({ value, locale, className }: DashboardRelativeTimeProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(formatRelativeAgo(locale, value));
  }, [locale, value]);

  return (
    <time
      dateTime={value}
      suppressHydrationWarning
      className={cn("shrink-0 text-xs text-muted-foreground", className)}
    >
      {label || "\u00a0"}
    </time>
  );
}
