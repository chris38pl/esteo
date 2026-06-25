"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function TemplateActionCard({
  icon: Icon,
  title,
  hint,
  disabled,
  onClick,
  href,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <div
      className={cn(
        "flex h-full min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-background/20 p-6 text-center transition-colors dark:bg-muted/10",
        disabled
          ? "opacity-60"
          : "hover:border-primary/50 hover:bg-background/40 dark:hover:bg-muted/20",
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-[14rem] text-xs text-muted-foreground">{hint}</p>
    </div>
  );

  if (disabled) {
    return content;
  }

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className="block h-full w-full text-left" onClick={onClick}>
      {content}
    </button>
  );
}
