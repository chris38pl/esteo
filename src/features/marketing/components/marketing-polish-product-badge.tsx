import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const labelByLocale: Record<Locale, string> = {
  pl: "Polski produkt",
  en: "Polish product",
};

function PolishFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 14"
      className={cn("block h-2.5 w-3.5 shrink-0", className)}
      aria-hidden
    >
      <clipPath id="esteo-marketing-pl-flag-clip">
        <rect width="20" height="14" rx="2.5" ry="2.5" />
      </clipPath>
      <g clipPath="url(#esteo-marketing-pl-flag-clip)">
        <rect width="20" height="7" fill="#ffffff" />
        <rect y="7" width="20" height="7" fill="#dc143c" />
      </g>
    </svg>
  );
}

export function MarketingPolishProductBadge({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1",
        "text-[10px] font-medium leading-none text-primary/90",
        "transition-colors hover:border-primary/45 hover:bg-primary/15",
        className,
      )}
    >
      <PolishFlagIcon />
      <span>{labelByLocale[locale]}</span>
    </span>
  );
}
