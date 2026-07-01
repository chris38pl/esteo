"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import type { HeroIndustryCard } from "@/features/marketing/components/hero/hero-industries-data";
import { cn } from "@/lib/utils";

import "./hero-industries-carousel.css";

const LOOP_COPIES = 3;
const AUTO_ADVANCE_MS = 3200;
const TRANSITION_MS = 550;
const SWIPE_THRESHOLD_PX = 48;

const cardPresenceVariants = {
  hidden: { opacity: 0.42, scale: 0.94, y: 12, filter: "blur(1px)" },
  visible: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
};

function IndustryCardImage({
  src,
  fallbackSrc,
  alt,
}: {
  src: string;
  fallbackSrc: string;
  alt: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}

function HeroIndustryCardItem({
  card,
  viewportRef,
  reduceMotion,
}: {
  card: HeroIndustryCard;
  viewportRef: RefObject<HTMLDivElement | null>;
  reduceMotion: boolean | null;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const cardEl = cardRef.current;
    const viewport = viewportRef.current;
    if (!cardEl || !viewport) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.45);
      },
      { root: viewport, threshold: [0, 0.25, 0.45, 0.7] },
    );

    observer.observe(cardEl);
    return () => observer.disconnect();
  }, [viewportRef]);

  return (
    <motion.article
      ref={cardRef}
      className="hero-industries-card flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border/35 bg-background"
      initial={false}
      animate={isVisible ? "visible" : "hidden"}
      variants={cardPresenceVariants}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.48, ease: [0.22, 1, 0.36, 1] }
      }
    >
      <div className="hero-industries-card__image overflow-hidden bg-background">
        <IndustryCardImage
          src={card.imageSrc}
          fallbackSrc={card.imageFallbackSrc}
          alt={card.imageAlt}
        />
      </div>

      <div aria-hidden className="hero-industries-card__image-fade" />

      <div className="hero-industries-card__body">
        <h3 className="text-sm font-semibold leading-tight text-foreground sm:text-[0.9375rem]">
          {card.title}
        </h3>

        <p className="line-clamp-3 text-[0.6875rem] leading-snug text-muted-foreground sm:text-xs">
          {card.items.join(", ")}
        </p>
      </div>
    </motion.article>
  );
}

type TrackMetrics = {
  cardStep: number;
};

export function HeroIndustriesCarousel({
  industries,
  copy,
}: {
  industries: HeroIndustryCard[];
  copy: {
    previous: string;
    next: string;
  };
}) {
  const reduceMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const count = industries.length;
  const loopedIndustries = useMemo(
    () => Array.from({ length: LOOP_COPIES }, () => industries).flat(),
    [industries],
  );

  const [index, setIndex] = useState(count);
  const [metrics, setMetrics] = useState<TrackMetrics>({ cardStep: 0 });
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const indexRef = useRef(index);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const measureTrack = useCallback(() => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) {
      return;
    }

    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    setMetrics({ cardStep: card.offsetWidth + gap });
  }, []);

  useEffect(() => {
    measureTrack();
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const observer = new ResizeObserver(measureTrack);
    observer.observe(viewport);
    window.addEventListener("resize", measureTrack);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureTrack);
    };
  }, [measureTrack, loopedIndustries.length]);

  const normalizeIndex = useCallback(
    (value: number) => {
      if (value >= count * 2) {
        return value - count;
      }
      if (value < count) {
        return value + count;
      }
      return value;
    },
    [count],
  );

  const handleTransitionEnd = useCallback(() => {
    const normalized = normalizeIndex(indexRef.current);
    if (normalized !== indexRef.current) {
      setTransitionEnabled(false);
      setIndex(normalized);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionEnabled(true));
      });
    }
  }, [normalizeIndex]);

  const goToIndex = useCallback((nextIndex: number) => {
    setTransitionEnabled(true);
    setIndex(nextIndex);
  }, []);

  const goNext = useCallback(() => {
    goToIndex(indexRef.current + 1);
  }, [goToIndex]);

  const goPrev = useCallback(() => {
    goToIndex(indexRef.current - 1);
  }, [goToIndex]);

  const goToLogical = useCallback(
    (logicalIndex: number) => {
      goToIndex(count + logicalIndex);
    },
    [count, goToIndex],
  );

  useEffect(() => {
    if (paused || reduceMotion || count === 0 || metrics.cardStep === 0) {
      return;
    }

    const timer = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion, count, metrics.cardStep, goNext]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      touchStartXRef.current = event.touches[0]?.clientX ?? null;
      setPaused(true);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const startX = touchStartXRef.current;
      touchStartXRef.current = null;
      setPaused(false);

      if (startX === null) {
        return;
      }

      const endX = event.changedTouches[0]?.clientX;
      if (endX === undefined) {
        return;
      }

      const deltaX = endX - startX;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
        return;
      }

      if (deltaX < 0) {
        goNext();
      } else {
        goPrev();
      }
    };

    viewport.addEventListener("touchstart", handleTouchStart, { passive: true });
    viewport.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      viewport.removeEventListener("touchstart", handleTouchStart);
      viewport.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goNext, goPrev]);

  const translateX = metrics.cardStep > 0 ? -index * metrics.cardStep : 0;
  const activeLogicalIndex = count > 0 ? ((index % count) + count) % count : 0;

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-8 sm:gap-10">
      <div
        className="flex w-full items-center gap-2 sm:gap-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setPaused(false);
          }
        }}
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden size-8 shrink-0 rounded-lg border-border/70 bg-card/50 sm:inline-flex"
          onClick={goPrev}
          aria-label={copy.previous}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div
          ref={viewportRef}
          className="hero-industries-viewport w-full min-w-0 flex-1 overflow-hidden sm:touch-auto"
        >
          <div
            ref={trackRef}
            className="hero-industries-track flex will-change-transform"
            style={{
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition:
                transitionEnabled && !reduceMotion
                  ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                  : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {loopedIndustries.map((card, itemIndex) => (
              <HeroIndustryCardItem
                key={`${itemIndex}-${card.id}`}
                card={card}
                viewportRef={viewportRef}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden size-8 shrink-0 rounded-lg border-border/70 bg-card/50 sm:inline-flex"
          onClick={goNext}
          aria-label={copy.next}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2">
        {industries.map((industry, dotIndex) => (
          <button
            key={industry.id}
            type="button"
            onClick={() => goToLogical(dotIndex)}
            className={cn(
              "h-2 shrink-0 rounded-full transition-all",
              dotIndex === activeLogicalIndex
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
            )}
            aria-label={industry.title}
            aria-current={dotIndex === activeLogicalIndex ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
