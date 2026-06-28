import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/lib/locale";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import { getMarketingHeaderNavigation } from "@/features/marketing/lib/navigation";
import { MarketingCTA } from "@/features/marketing/components/cta";

export function MarketingHeader({ locale }: { locale: Locale }) {
  const navigation = getMarketingHeaderNavigation(locale);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href={buildLocalizedPath(locale)} className="flex items-center gap-3">
          <span className="relative size-9 overflow-hidden rounded-full">
            <Image src="/logo.png" alt="" fill sizes="36px" className="object-cover" priority />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">Esteo</span>
        </Link>

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

        <MarketingCTA href={`/${locale}/sign-in`} size="sm">
          {locale === "pl" ? "Zaloguj sie" : "Sign in"}
        </MarketingCTA>
      </div>
    </header>
  );
}
