"use client";

import { ArrowRight, Globe, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MarketingCTA } from "@/features/marketing/components/cta";
import { MarketingUserAvatarButton } from "@/features/marketing/components/marketing-user-avatar-button";
import type { MarketingNavigationItem } from "@/features/marketing/lib/navigation";
import { useMarketingAuthCta } from "@/features/marketing/lib/use-marketing-auth-cta";
import { switchAppLocale } from "@/lib/locale-navigation";
import { localeOptions, type Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type MarketingMobileNavProps = {
  locale: Locale;
  navigation: MarketingNavigationItem[];
  isSignedIn: boolean;
};

export function MarketingMobileNav({
  locale,
  navigation,
  isSignedIn,
}: MarketingMobileNavProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const query = searchParams?.toString();
  const { copy, appHref, resolvePrimaryCta } = useMarketingAuthCta(locale);

  const primaryCta = resolvePrimaryCta(
    {
      href: `/${locale}/sign-up`,
      label: locale === "pl" ? "Zacznij za darmo" : "Start for free",
    },
    "goToApp",
  );

  function handleLocaleSwitch(nextLocale: Locale) {
    const nextPath = switchAppLocale(pathname, locale, nextLocale, query);
    if (!nextPath) {
      return;
    }

    setOpen(false);
    router.push(nextPath);
  }

  function handleNavClick() {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-lg text-foreground transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 md:hidden"
          aria-label={locale === "pl" ? "Otwórz menu nawigacji" : "Open navigation menu"}
        >
          <Menu className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex w-full max-w-sm flex-col gap-0 border-border/60 bg-background/95 p-0 backdrop-blur-xl"
      >
        <SheetTitle className="sr-only">
          {locale === "pl" ? "Menu nawigacji" : "Navigation menu"}
        </SheetTitle>

        <nav className="flex flex-col px-5 pt-16">
          {navigation.map((item) => (
            <SheetClose asChild key={item.id}>
              <Link
                href={item.href}
                onClick={handleNavClick}
                className="border-b border-border/40 py-4 text-base font-medium text-foreground transition hover:text-primary"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="border-t border-border/40 px-5 py-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Globe className="size-4" aria-hidden />
            <span>{locale === "pl" ? "Język" : "Language"}</span>
          </div>

          <div
            className="grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-card/40 p-1"
            role="group"
            aria-label={locale === "pl" ? "Wybierz język" : "Choose language"}
          >
            {localeOptions.map((option) => {
              const isActive = option.value === locale;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleLocaleSwitch(option.value)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto space-y-3 border-t border-border/40 px-5 py-6">
          {!isSignedIn ? (
            <Button asChild variant="ghost" className="h-11 w-full justify-center text-sm font-semibold">
              <Link href={`/${locale}/sign-in`} onClick={handleNavClick}>
                {copy.headerSignIn}
              </Link>
            </Button>
          ) : (
            <div className="flex justify-center pb-1">
              <MarketingUserAvatarButton />
            </div>
          )}

          <MarketingCTA
            href={isSignedIn ? appHref : primaryCta.href}
            className="h-11 w-full justify-center text-sm font-semibold shadow-lg shadow-blue-500/20"
            onClick={handleNavClick}
          >
            {isSignedIn ? copy.goToApp : primaryCta.label}
            <ArrowRight className="size-4" />
          </MarketingCTA>
        </div>
      </SheetContent>
    </Sheet>
  );
}
