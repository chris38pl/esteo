"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Ellipsis, ExternalLink, Link2, Mail, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";
import {
  ESTIMATES_LIST_HERO_BACKGROUNDS,
  ESTIMATES_LIST_HERO_IMAGES,
} from "@/features/estimates/lib/estimates-list-hero-images";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const estimateHeroButtonBaseClassName =
  "inline-flex min-h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium shadow-xs [&_svg]:shrink-0";

const estimateHeroFormButtonClassName = cn(
  estimateHeroButtonBaseClassName,
  "bg-emerald-800 text-white hover:bg-emerald-900 dark:bg-emerald-800 dark:text-white dark:hover:bg-emerald-900",
);

interface EstimateRequestFormHeroCardProps {
  workspaceSlug: string;
  locale: Locale;
  className?: string;
  onCopyFormLink?: () => void;
  onFormLinkShared?: () => void;
}

function FormHeroStyles() {
  const { form } = ESTIMATES_LIST_HERO_BACKGROUNDS;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.estimates-list-hero-card--form {
  --hero-card-bg: ${form.light};
  background-color: ${form.light};
}
.dark .estimates-list-hero-card--form {
  --hero-card-bg: ${form.dark};
  background-color: ${form.dark};
}
.estimates-list-hero-text-scrim {
  pointer-events: none;
  position: absolute;
  inset-block: 0;
  left: 0;
  z-index: 1;
  width: min(70%, 24rem);
  background: linear-gradient(
    90deg,
    var(--hero-card-bg) 0%,
    var(--hero-card-bg) 36%,
    color-mix(in oklab, var(--hero-card-bg) 78%, transparent) 58%,
    transparent 100%
  );
}
.estimates-list-hero-body {
  position: relative;
  z-index: 10;
}
.estimates-list-hero-content {
  max-width: min(68%, 26rem);
}
@media (max-width: 1280px) {
  .estimates-list-hero-text-scrim {
    width: min(80%, 100%);
  }
  .estimates-list-hero-content {
    max-width: min(78%, 26rem);
  }
}
@media (max-width: 768px) {
  .estimates-list-hero-text-scrim {
    width: min(94%, 100%);
    background: linear-gradient(
      90deg,
      var(--hero-card-bg) 0%,
      var(--hero-card-bg) 44%,
      color-mix(in oklab, var(--hero-card-bg) 88%, transparent) 68%,
      color-mix(in oklab, var(--hero-card-bg) 42%, transparent) 86%,
      transparent 100%
    );
  }
  .estimates-list-hero-content {
    max-width: min(90%, 100%);
  }
}
@media (max-width: 480px) {
  .estimates-list-hero-text-scrim {
    width: 100%;
    background: linear-gradient(
      90deg,
      var(--hero-card-bg) 0%,
      var(--hero-card-bg) 50%,
      color-mix(in oklab, var(--hero-card-bg) 92%, transparent) 72%,
      color-mix(in oklab, var(--hero-card-bg) 58%, transparent) 88%,
      transparent 100%
    );
  }
  .estimates-list-hero-content {
    max-width: 100%;
  }
}
`.trim(),
      }}
    />
  );
}

function HeroCardTextScrim() {
  return <div aria-hidden className="estimates-list-hero-text-scrim" />;
}

function HeroCardCopy({
  eyebrow,
  title,
  descriptionLine1,
  descriptionLine2,
  eyebrowClassName,
}: {
  eyebrow: string;
  title: string;
  descriptionLine1: string;
  descriptionLine2: string;
  eyebrowClassName: string;
}) {
  return (
    <div>
      <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em]", eyebrowClassName)}>
        {eyebrow}
      </p>
      <h2 className="mt-4 mb-5 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
        {title}
      </h2>
      <div className="space-y-0.5 text-sm leading-relaxed text-muted-foreground">
        <p>{descriptionLine1}</p>
        <p>{descriptionLine2}</p>
      </div>
    </div>
  );
}

function HeroCardArtworkLayer({ src, modeClassName }: { src: string; modeClassName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLImageElement>(null);
  const [gapWidth, setGapWidth] = useState(0);

  const measureGap = useCallback(() => {
    const main = mainRef.current;
    if (!main) {
      return;
    }
    setGapWidth(Math.max(0, Math.round(main.offsetLeft)));
  }, []);

  useLayoutEffect(() => {
    measureGap();

    const main = mainRef.current;
    const container = containerRef.current;
    if (!main || !container) {
      return;
    }

    const resizeObserver = new ResizeObserver(measureGap);
    resizeObserver.observe(container);
    resizeObserver.observe(main);

    main.addEventListener("load", measureGap);

    return () => {
      resizeObserver.disconnect();
      main.removeEventListener("load", measureGap);
    };
  }, [src, measureGap]);

  const artworkImageClassName = "block h-full w-auto max-w-none select-none";

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", modeClassName)}
    >
      {gapWidth > 0 ? (
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: gapWidth }}
        >
          <img
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            className={cn(artworkImageClassName, "absolute top-0 origin-right -scale-x-100")}
            style={{ right: 0 }}
          />
        </div>
      ) : null}
      <img
        ref={mainRef}
        src={src}
        alt=""
        draggable={false}
        onLoad={measureGap}
        className={cn(artworkImageClassName, "absolute top-0 right-0")}
      />
    </div>
  );
}

function HeroCardArtwork({ lightSrc, darkSrc }: { lightSrc: string; darkSrc: string }) {
  return (
    <>
      <HeroCardArtworkLayer src={lightSrc} modeClassName="dark:hidden" />
      <HeroCardArtworkLayer src={darkSrc} modeClassName="hidden dark:block" />
    </>
  );
}

function ShareIconButton({
  label,
  onClick,
  href,
  onShare,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  onShare?: () => void;
  children: ReactNode;
}) {
  const className = cn(
    "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-xs",
    "transition-colors hover:bg-accent hover:text-foreground",
  );

  const button =
    href != null ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={className}
        onClick={() => onShare?.()}
      >
        {children}
      </a>
    ) : (
      <button type="button" onClick={onClick} aria-label={label} className={className}>
        {children}
      </button>
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", className)} fill="currentColor">
      <path d="M12 2C6.48 2 2 6.13 2 11.07c0 2.77 1.37 5.24 3.52 6.86V22l3.22-1.77c.86.24 1.77.37 2.71.37 5.52 0 10-4.13 10-9.07S17.52 2 12 2zm.55 11.96-2.6-2.77-4.98 2.77 5.49-5.84 2.66 2.77 4.91-2.77-5.48 5.84z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", className)} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 2C6.486 2 2 6.486 2 12c0 1.77.46 3.43 1.268 4.87L2 22l5.29-1.39A9.96 9.96 0 0 0 12 22c5.514 0 10-4.486 10-10S17.514 2 12 2z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4", className)} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function EstimateRequestFormHeroCard({
  workspaceSlug,
  locale,
  className,
  onCopyFormLink,
  onFormLinkShared,
}: EstimateRequestFormHeroCardProps) {
  const t = useTranslations("estimates");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
  }, []);

  const publicPath = getPublicEstimateRequestPath(locale, workspaceSlug);
  const [publicUrl, setPublicUrl] = useState(publicPath);

  useEffect(() => {
    setPublicUrl(`${window.location.origin}${publicPath}`);
  }, [publicPath]);

  const shareUrls = useMemo(() => {
    const encoded = encodeURIComponent(publicUrl);
    return {
      whatsapp: `https://wa.me/?text=${encoded}`,
      messenger: `https://www.facebook.com/dialog/send?link=${encoded}&redirect_uri=${encoded}`,
      x: `https://twitter.com/intent/tweet?url=${encoded}`,
      email: `mailto:?subject=${encodeURIComponent(t("list.hero.form.shareEmailSubject"))}&body=${encoded}`,
    };
  }, [publicUrl, t]);

  const handleCopyLink = useCallback(async () => {
    if (onCopyFormLink) {
      onCopyFormLink();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t("list.hero.form.copyFallback"), publicUrl);
    }
  }, [onCopyFormLink, publicUrl, t]);

  const handleNativeShare = useCallback(async () => {
    if (typeof navigator.share !== "function") {
      return;
    }
    try {
      await navigator.share({
        url: publicUrl,
        title: t("list.hero.form.shareEmailSubject"),
      });
      onFormLinkShared?.();
    } catch {
      // User dismissed share sheet.
    }
  }, [onFormLinkShared, publicUrl, t]);

  return (
    <TooltipProvider>
      <FormHeroStyles />
      <article
        className={cn(
          "estimates-list-hero-card estimates-list-hero-card--form",
          "surface-card relative isolate min-h-[11.5rem] overflow-hidden border-emerald-200/40 md:min-h-[12.5rem] dark:border-emerald-900/30",
          className,
        )}
      >
        <HeroCardArtwork
          lightSrc={ESTIMATES_LIST_HERO_IMAGES.form.light}
          darkSrc={ESTIMATES_LIST_HERO_IMAGES.form.dark}
        />
        <HeroCardTextScrim />
        <div className="estimates-list-hero-body flex min-h-[11.5rem] flex-col justify-between gap-5 p-6 md:min-h-[12.5rem] md:p-8">
          <div className="flex flex-1 flex-col justify-between gap-5">
            <div className="estimates-list-hero-content">
              <HeroCardCopy
                eyebrow={t("list.hero.form.eyebrow")}
                title={t("list.hero.form.title")}
                descriptionLine1={t("list.hero.form.descriptionLine1")}
                descriptionLine2={t("list.hero.form.descriptionLine2")}
                eyebrowClassName="text-emerald-700 dark:text-emerald-500"
              />
            </div>

            <div className="flex w-full flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                  <Button asChild className={estimateHeroFormButtonClassName}>
                    <Link href={publicPath} target="_blank" rel="noopener noreferrer">
                      {t("list.hero.form.cta")}
                      <ExternalLink className="size-4" />
                    </Link>
                  </Button>

                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {t("list.hero.form.shareLabel")}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ShareIconButton
                        label={copied ? t("list.hero.form.copied") : t("list.hero.form.copyLink")}
                        onClick={() => void handleCopyLink()}
                      >
                        <Link2 className="size-4" />
                      </ShareIconButton>
                      <ShareIconButton
                        label="Messenger"
                        href={shareUrls.messenger}
                        onShare={onFormLinkShared}
                      >
                        <MessengerIcon />
                      </ShareIconButton>
                      <ShareIconButton
                        label="WhatsApp"
                        href={shareUrls.whatsapp}
                        onShare={onFormLinkShared}
                      >
                        <WhatsAppIcon />
                      </ShareIconButton>
                      <ShareIconButton label="X" href={shareUrls.x} onShare={onFormLinkShared}>
                        <XIcon />
                      </ShareIconButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={t("list.hero.form.shareMore")}
                            className={cn(
                              "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-xs",
                              "transition-colors hover:bg-accent hover:text-foreground",
                            )}
                          >
                            <Ellipsis className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={shareUrls.email} onClick={() => onFormLinkShared?.()}>
                              <Mail className="size-4" />
                              {t("list.hero.form.shareEmail")}
                            </a>
                          </DropdownMenuItem>
                          {canNativeShare ? (
                            <DropdownMenuItem onClick={() => void handleNativeShare()}>
                              <Share2 className="size-4" />
                              {t("list.hero.form.shareNative")}
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                </div>
              </div>
            </div>
        </div>
      </article>
    </TooltipProvider>
  );
}
