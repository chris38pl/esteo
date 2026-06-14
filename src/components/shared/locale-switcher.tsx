"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildLocalePath } from "@/lib/locale-navigation";
import type { Locale } from "@/lib/locale";
import { locales } from "@/lib/locale";
import { cn } from "@/lib/utils";

const compactShellClass =
  "inline-flex h-9 overflow-hidden rounded-lg border border-border/60 bg-card/40 shadow-none";

const defaultShellClass =
  "inline-flex h-11 overflow-hidden rounded-xl border border-border/60 bg-card/60 shadow-none backdrop-blur supports-[backdrop-filter]:bg-card/40";

export function LocaleSwitcher({
  value,
  labels = { pl: "PL", en: "EN" },
  ariaLabel = "Switch language",
  compact = false,
}: {
  value: Locale;
  labels?: Record<Locale, string>;
  ariaLabel?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams?.toString();
  const href = buildLocalePath(pathname ?? "", value, query);

  return (
    <div
      className={compact ? compactShellClass : defaultShellClass}
      role="group"
      aria-label={ariaLabel}
    >
      {locales.map((l, index) => {
        const next = buildLocalePath(pathname ?? "", l, query);
        const active = l === value;

        return (
          <button
            key={l}
            type="button"
            aria-label={`${ariaLabel}: ${labels[l]}`}
            aria-pressed={active}
            className={cn(
              "flex h-full flex-1 items-center justify-center font-semibold transition cursor-pointer",
              compact ? "min-w-9 text-xs" : "min-w-11 text-sm",
              index > 0 && "border-l border-border/60",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
            onClick={() => router.push(next)}
          >
            {labels[l]}
          </button>
        );
      })}
      {/* Keep for accessibility and copy-link flows */}
      <a className="sr-only" href={href}>
        {href}
      </a>
    </div>
  );
}
