"use client";

import { ChevronDown } from "lucide-react";
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

export function ProfileLanguageSelect({ locale }: { locale: Locale }) {
  const t = useTranslations("navbar.userMenu");
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
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{t("language")}</p>
        <p className="text-xs text-muted-foreground">{t("languageHint")}</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-xl border border-border/60",
              "bg-muted/20 px-4 py-3 text-left text-sm transition hover:bg-muted/35",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden className="text-base leading-none">
                {active.flag}
              </span>
              <span className="font-medium text-foreground">
                {active.value.toUpperCase()} {active.label}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
          {locales.map((value) => {
            const option = localeOptions.find((entry) => entry.value === value)!;

            return (
              <DropdownMenuItem
                key={value}
                className="gap-2.5"
                onSelect={() => handleSwitch(value)}
              >
                <span aria-hidden>{option.flag}</span>
                <span>
                  {option.value.toUpperCase()} {option.label}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
