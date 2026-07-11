"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import type { Locale } from "@/lib/locale";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import { getMarketingHeaderNavigation } from "@/features/marketing/lib/navigation";
import { MarketingHeaderAuth } from "@/features/marketing/components/marketing-header-auth";
import { MarketingMobileNav } from "@/features/marketing/components/marketing-mobile-nav";
import { MarketingPolishProductBadge } from "@/features/marketing/components/marketing-polish-product-badge";
import { cn } from "@/lib/utils";

function MarketingHeaderInner({ locale }: { locale: Locale }) {
  const navigation = getMarketingHeaderNavigation(locale);
  const pathname = usePathname() ?? "";
  const [scrolled, setScrolled] = useState(false);
  const isLandingPage =
    pathname === `/${locale}` || pathname === `/${locale}/`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl transition-[height,background-color,border-color] duration-300",
        scrolled && "border-border/50 bg-background/90",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl items-center justify-between px-5 transition-[height] duration-300 sm:px-8",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
          <Link href={buildLocalizedPath(locale)} className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "relative shrink-0 overflow-hidden rounded-full transition-[width,height] duration-300",
                scrolled ? "size-8" : "size-9",
              )}
            >
              <Image src="/logo.png" alt="" fill sizes="36px" className="object-cover" priority />
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">Esteo</span>
          </Link>
          {isLandingPage ? (
            <MarketingPolishProductBadge locale={locale} className="hidden sm:inline-flex" />
          ) : null}
        </div>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {navigation.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="transition hover:text-foreground"
              aria-disabled={!item.implemented}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <MarketingHeaderAuth locale={locale} />

          <MarketingMobileNav locale={locale} navigation={navigation} />
        </div>
      </div>
    </header>
  );
}

export function MarketingHeader({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={null}>
      <MarketingHeaderInner locale={locale} />
    </Suspense>
  );
}
