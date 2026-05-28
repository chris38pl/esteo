"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { Locale } from "@/lib/locale";
import { locales } from "@/lib/locale";

function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  const current = segments[1];
  if (locales.includes(current as Locale)) {
    segments[1] = locale;
    return segments.join("/") || `/${locale}`;
  }
  return `/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

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
  const hrefBase = pathname ? withLocale(pathname, value) : `/${value}`;
  const href = query ? `${hrefBase}?${query}` : hrefBase;

  return (
    <div
      className={
        compact
          ? "inline-flex items-center gap-0.5 rounded-md border border-border/50 bg-[var(--sidebar-search)] p-0.5"
          : "inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 text-sm"
      }
    >
      {locales.map((l) => {
        const nextBase = pathname ? withLocale(pathname, l) : `/${l}`;
        const next = query ? `${nextBase}?${query}` : nextBase;
        const active = l === value;

        return (
          <button
            key={l}
            type="button"
            aria-label={`${ariaLabel}: ${labels[l]}`}
            aria-current={active ? "page" : undefined}
            className={[
              compact
                ? "rounded px-1.5 py-0.5 text-[10px] font-medium transition cursor-pointer"
                : "rounded-full px-2.5 py-1 text-xs font-medium transition cursor-pointer",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
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

