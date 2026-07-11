"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { CookieConsentContent } from "@/features/marketing/content/cookie-consent-content";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";

import { CookieConsentIcon } from "./cookie-consent-category-rows";

const secondaryCtaClassName =
  "min-w-[7rem] flex-1 border-primary/45 bg-transparent text-foreground shadow-none hover:bg-primary/10 hover:text-foreground md:flex-none md:px-6";

type CookieConsentInitialViewProps = {
  locale: Locale;
  content: CookieConsentContent;
  onAcceptAll: () => void;
  onCustomize: () => void;
  onReject: () => void;
  customizeExpanded: boolean;
};

export function CookieConsentInitialView({
  locale,
  content,
  onAcceptAll,
  onCustomize,
  onReject,
  customizeExpanded,
}: CookieConsentInitialViewProps) {
  const cookiesHref = buildLocalizedPath(locale, "/legal/cookies");

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-stretch md:justify-between md:gap-16 lg:gap-24">
      <div className="flex min-w-0 flex-1 items-center gap-5 md:max-w-[42%] md:gap-6">
        <CookieConsentIcon size="banner" />
        <div className="min-w-0 space-y-2.5">
          <p className="text-base font-semibold tracking-tight text-foreground md:text-lg">{content.bannerTitle}</p>
          <p className="text-sm leading-6 text-muted-foreground md:hidden">{content.bannerDescriptionShort}</p>
          <p className="hidden text-sm leading-6 text-muted-foreground md:block">{content.bannerDescription}</p>
          <Link
            href={cookiesHref}
            className="inline-block text-sm text-primary underline-offset-4 transition hover:underline"
          >
            {content.learnMoreLink}
          </Link>
        </div>
      </div>

      <div className="flex w-full flex-col md:w-fit md:shrink-0 md:items-end md:self-stretch md:justify-center">
        <div className="flex w-full flex-col gap-2.5 md:w-auto">
          <div className="flex w-full flex-wrap items-center justify-center gap-2.5 md:w-auto md:justify-end md:gap-4">
            <Button type="button" className="min-w-[7rem] flex-1 md:flex-none md:px-6" onClick={onAcceptAll}>
              {content.ctaAcceptShort}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={secondaryCtaClassName}
              onClick={onCustomize}
              aria-expanded={customizeExpanded}
            >
              {content.ctaCustomize}
            </Button>
            <Button type="button" variant="outline" className={secondaryCtaClassName} onClick={onReject}>
              {content.ctaReject}
            </Button>
          </div>
          <p className="w-full text-center text-xs leading-5 text-muted-foreground/80 md:text-right">
            {content.trustLine}
          </p>
        </div>
      </div>
    </div>
  );
}
