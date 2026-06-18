"use client";

import { ChevronDown, Languages } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchAppLocale } from "@/lib/locale-navigation";
import { localeOptions, locales, type Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function AuthLocaleToggle({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const query = searchParams?.toString();

  const active = localeOptions.find((option) => option.value === locale) ?? localeOptions[0];

  function handleSwitch(nextLocale: Locale) {
    const nextPath = switchAppLocale(pathname, locale, nextLocale, query);
    if (nextPath) {
      router.push(nextPath);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("languageToggle")}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium",
            "opacity-65 shadow-none backdrop-blur-sm transition hover:opacity-90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            className,
          )}
        >
          <Languages className="size-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          <span>{active.value.toUpperCase()}</span>
          <ChevronDown className="size-3 opacity-70" strokeWidth={2.5} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[9rem]">
        {locales.map((value) => {
          const option = localeOptions.find((entry) => entry.value === value)!;

          return (
            <DropdownMenuItem key={value} onSelect={() => handleSwitch(value)}>
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}