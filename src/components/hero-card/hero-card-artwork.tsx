"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type HeroArtworkAlign = "left" | "right";

/**
 * Responsive hero artwork with optional horizontal mirror to fill viewport gap.
 * - `right` (default): main image on the right, mirrored on the left (estimates list cards).
 * - `left`: main image on the left, mirrored on the right (public estimate-request page).
 */
function HeroCardArtworkLayer({
  src,
  modeClassName,
  mainImageClassName,
  align = "right",
}: {
  src: string;
  modeClassName: string;
  mainImageClassName?: string;
  align?: HeroArtworkAlign;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLImageElement>(null);
  const [gapWidth, setGapWidth] = useState(0);
  const [mainWidth, setMainWidth] = useState(0);

  const measureGap = useCallback(() => {
    const main = mainRef.current;
    const container = containerRef.current;
    if (!main || !container) {
      return;
    }

    if (align === "left") {
      const width = Math.round(main.offsetWidth);
      setMainWidth(width);
      setGapWidth(Math.max(0, Math.round(container.clientWidth - width)));
      return;
    }

    setGapWidth(Math.max(0, Math.round(main.offsetLeft)));
  }, [align]);

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
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        modeClassName,
      )}
    >
      {gapWidth > 0 && align === "right" ? (
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
      {gapWidth > 0 && align === "left" ? (
        <div
          className="absolute inset-y-0 overflow-hidden"
          style={{ left: mainWidth, width: gapWidth }}
        >
          <img
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            className={cn(
              artworkImageClassName,
              "absolute top-0 right-full origin-right -scale-x-100",
            )}
          />
        </div>
      ) : null}
      <img
        ref={mainRef}
        src={src}
        alt=""
        draggable={false}
        onLoad={measureGap}
        className={cn(
          artworkImageClassName,
          "hero-card-artwork-main absolute top-0",
          align === "left" ? "left-0" : "right-0",
          mainImageClassName,
        )}
      />
    </div>
  );
}

export function HeroCardArtwork({
  lightSrc,
  darkSrc,
  mainImageClassName,
  align = "right",
}: {
  lightSrc: string;
  darkSrc: string;
  mainImageClassName?: string;
  align?: HeroArtworkAlign;
}) {
  return (
    <>
      <HeroCardArtworkLayer
        src={lightSrc}
        modeClassName="dark:hidden"
        mainImageClassName={mainImageClassName}
        align={align}
      />
      <HeroCardArtworkLayer
        src={darkSrc}
        modeClassName="hidden dark:block"
        mainImageClassName={mainImageClassName}
        align={align}
      />
    </>
  );
}

type HeroCardLayoutOptions = {
  /** Billing wide banner: one soft scrim behind entire body (text + actions). */
  bodyScrim?: boolean;
  /** @deprecated Use bodyScrim */
  contentScrim?: boolean;
};

export function getHeroCardLayoutCss(
  cardSelector: string,
  backgrounds: { light: string; dark: string },
  options?: HeroCardLayoutOptions,
) {
  const fullBleedScrim = `
.hero-card-text-scrim--full {
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
}`;

  const contentScrim = `
.hero-card-content--with-scrim {
  position: relative;
  isolation: isolate;
}
.hero-card-text-scrim--content {
  pointer-events: none;
  position: absolute;
  top: -1.5rem;
  right: -7rem;
  bottom: -1.5rem;
  left: -1.5rem;
  z-index: 0;
  background: linear-gradient(
    90deg,
    var(--hero-card-bg) 0%,
    var(--hero-card-bg) 42%,
    color-mix(in oklab, var(--hero-card-bg) 82%, transparent) 68%,
    transparent 100%
  );
}
.hero-card-content-inner {
  position: relative;
  z-index: 1;
}`;

  const bodyScrim = `
.hero-card-body--with-scrim {
  position: relative;
  isolation: isolate;
}
.hero-card-text-scrim--body {
  pointer-events: none;
  position: absolute;
  inset: 0;
  right: -4rem;
  z-index: 0;
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--hero-card-bg) 94%, transparent) 0%,
    color-mix(in oklab, var(--hero-card-bg) 82%, transparent) 32%,
    color-mix(in oklab, var(--hero-card-bg) 52%, transparent) 56%,
    color-mix(in oklab, var(--hero-card-bg) 22%, transparent) 76%,
    transparent 100%
  );
}
.hero-card-body-inner {
  position: relative;
  z-index: 1;
}`;

  const scrimBlock = options?.bodyScrim
    ? bodyScrim
    : options?.contentScrim
      ? contentScrim
      : fullBleedScrim;

  return `
${cardSelector} {
  --hero-card-bg: ${backgrounds.light};
  background-color: ${backgrounds.light};
}
.dark ${cardSelector} {
  --hero-card-bg: ${backgrounds.dark};
  background-color: ${backgrounds.dark};
}
${scrimBlock}
.hero-card-body {
  position: relative;
  z-index: 10;
}
.hero-card-content {
  max-width: min(68%, 26rem);
}
@media (max-width: 1280px) {
  .hero-card-text-scrim--full {
    width: min(80%, 100%);
  }
  .hero-card-content {
    max-width: min(78%, 26rem);
  }
}
@media (max-width: 768px) {
  .hero-card-text-scrim--full {
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
  .hero-card-text-scrim--content {
    right: -3rem;
    background: linear-gradient(
      90deg,
      var(--hero-card-bg) 0%,
      var(--hero-card-bg) 48%,
      color-mix(in oklab, var(--hero-card-bg) 90%, transparent) 72%,
      transparent 100%
    );
  }
  .hero-card-text-scrim--body {
    right: -1.5rem;
    background: linear-gradient(
      90deg,
      color-mix(in oklab, var(--hero-card-bg) 96%, transparent) 0%,
      color-mix(in oklab, var(--hero-card-bg) 88%, transparent) 38%,
      color-mix(in oklab, var(--hero-card-bg) 58%, transparent) 62%,
      color-mix(in oklab, var(--hero-card-bg) 28%, transparent) 82%,
      transparent 100%
    );
  }
  .hero-card-content {
    max-width: min(90%, 100%);
  }
}
@media (max-width: 480px) {
  .hero-card-text-scrim--full {
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
  .hero-card-text-scrim--content {
    right: -1.5rem;
    background: linear-gradient(
      90deg,
      var(--hero-card-bg) 0%,
      var(--hero-card-bg) 52%,
      color-mix(in oklab, var(--hero-card-bg) 92%, transparent) 76%,
      transparent 100%
    );
  }
  .hero-card-text-scrim--body {
    right: -0.5rem;
    background: linear-gradient(
      90deg,
      color-mix(in oklab, var(--hero-card-bg) 97%, transparent) 0%,
      color-mix(in oklab, var(--hero-card-bg) 90%, transparent) 42%,
      color-mix(in oklab, var(--hero-card-bg) 62%, transparent) 66%,
      color-mix(in oklab, var(--hero-card-bg) 32%, transparent) 86%,
      transparent 100%
    );
  }
  .hero-card-content {
    max-width: 100%;
  }
}
`.trim();
}
