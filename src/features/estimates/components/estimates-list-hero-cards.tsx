"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { EstimateRequestFormHeroCard } from "@/features/estimate-requests/components/estimate-request-form-hero-card";
import {
  ESTIMATES_LIST_HERO_BACKGROUNDS,
  ESTIMATES_LIST_HERO_IMAGES,
} from "@/features/estimates/lib/estimates-list-hero-images";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const estimateHeroButtonBaseClassName =
  "inline-flex min-h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium shadow-xs [&_svg]:shrink-0";

const estimateHeroCreateButtonClassName = cn(
  estimateHeroButtonBaseClassName,
  "bg-blue-600 text-white hover:bg-blue-700 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90",
);

interface EstimatesListHeroCardsProps {
  workspaceSlug: string;
  locale: Locale;
  onCreateClick: () => void;
  onCopyFormLink?: () => void;
  onFormLinkShared?: () => void;
  showFormReadyIntro?: boolean;
}

function EstimatesListHeroStyles() {
  const { create } = ESTIMATES_LIST_HERO_BACKGROUNDS;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.estimates-list-hero-card--create {
  --hero-card-bg: ${create.light};
  background-color: ${create.light};
}
.dark .estimates-list-hero-card--create {
  --hero-card-bg: ${create.dark};
  background-color: ${create.dark};
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

export function EstimatesListHeroCards({
  workspaceSlug,
  locale,
  onCreateClick,
  onCopyFormLink,
  onFormLinkShared,
  showFormReadyIntro,
}: EstimatesListHeroCardsProps) {
  const t = useTranslations("estimates");

  return (
    <>
      <EstimatesListHeroStyles />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article
          className={cn(
            "estimates-list-hero-card estimates-list-hero-card--create",
            "surface-card relative isolate min-h-[11.5rem] overflow-hidden border-blue-200/40 md:min-h-[12.5rem] dark:border-blue-900/30",
          )}
        >
          <HeroCardArtwork
            lightSrc={ESTIMATES_LIST_HERO_IMAGES.create.light}
            darkSrc={ESTIMATES_LIST_HERO_IMAGES.create.dark}
          />
          <HeroCardTextScrim />
          <div className="estimates-list-hero-body flex min-h-[11.5rem] flex-col justify-between gap-5 p-6 md:min-h-[12.5rem] md:p-8">
            <div className="estimates-list-hero-content">
              <HeroCardCopy
                eyebrow={t("list.hero.create.eyebrow")}
                title={t("list.hero.create.title")}
                descriptionLine1={t("list.hero.create.descriptionLine1")}
                descriptionLine2={t("list.hero.create.descriptionLine2")}
                eyebrowClassName="text-blue-600 dark:text-blue-400"
              />
            </div>
            <Button onClick={onCreateClick} className={estimateHeroCreateButtonClassName}>
              <Plus className="size-4" />
              {t("list.hero.create.cta")}
            </Button>
          </div>
        </article>

        <EstimateRequestFormHeroCard
          workspaceSlug={workspaceSlug}
          locale={locale}
          onCopyFormLink={onCopyFormLink}
          onFormLinkShared={onFormLinkShared}
          showFormReadyIntro={showFormReadyIntro}
        />
      </div>
    </>
  );
}
