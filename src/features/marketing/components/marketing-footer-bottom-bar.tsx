"use client";

import { ChevronDown, Globe } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { siteConfig } from "@/features/marketing/seo/site-config";
import { switchAppLocale } from "@/lib/locale-navigation";
import { localeOptions, type Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function MarketingFooterBottomBar({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const query = searchParams?.toString();

  const currentLocaleLabel =
    localeOptions.find((option) => option.value === locale)?.label ?? locale;

  function handleLocaleSwitch(nextLocale: Locale) {
    const nextPath = switchAppLocale(pathname, locale, nextLocale, query);
    if (nextPath) {
      router.push(nextPath);
    }
  }

  const copyright =
    locale === "pl"
      ? `© ${new Date().getFullYear()} ${siteConfig.companyName}. Wszelkie prawa zastrzeżone.`
      : `© ${new Date().getFullYear()} ${siteConfig.companyName}. All rights reserved.`;

  return (
    <div className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="shrink-0 text-sm text-muted-foreground">{copyright}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-6">
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
            <span>
              Made with <span aria-label="love">❤️</span> in Poland
            </span>
            <span className="text-border/80" aria-hidden>
              |
            </span>
            <span>Powered by AI</span>
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition",
                "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
              )}
            >
              <Globe className="size-4 shrink-0" aria-hidden />
              <span>{currentLocaleLabel}</span>
              <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {localeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleLocaleSwitch(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
