"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  FileText,
  Globe,
  Mic,
  Palette,
  Settings2,
  Sparkles,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import type {
  FeatureHighlight,
  FeatureHighlightIconKey,
  FeaturesContent,
} from "@/features/marketing/components/features-section/features-data";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_MS = 4500;
const CARD_GAP_PX = 16;

const featureIcons: Record<FeatureHighlightIconKey, LucideIcon> = {
  sparkles: Sparkles,
  table: Table2,
  settings: Settings2,
  "file-text": FileText,
  mic: Mic,
  palette: Palette,
  globe: Globe,
};

const MOBILE_MEDIA_QUERY = "(max-width: 639px)";

type CarouselLayout = {
  mode: "mobile-stack" | "horizontal";
  visibleCount: number;
};

function useCarouselLayout() {
  const [layout, setLayout] = useState<CarouselLayout>({
    mode: "horizontal",
    visibleCount: 1,
  });

  useLayoutEffect(() => {
    const mobile = window.matchMedia(MOBILE_MEDIA_QUERY);
    const wide = window.matchMedia("(min-width: 1280px)");
    const large = window.matchMedia("(min-width: 1024px)");
    const medium = window.matchMedia("(min-width: 640px)");

    function updateLayout() {
      if (mobile.matches) {
        setLayout({ mode: "mobile-stack", visibleCount: 2 });
        return;
      }
      if (wide.matches) {
        setLayout({ mode: "horizontal", visibleCount: 4 });
        return;
      }
      if (large.matches) {
        setLayout({ mode: "horizontal", visibleCount: 3 });
        return;
      }
      if (medium.matches) {
        setLayout({ mode: "horizontal", visibleCount: 2 });
        return;
      }
      setLayout({ mode: "horizontal", visibleCount: 1 });
    }

    updateLayout();
    mobile.addEventListener("change", updateLayout);
    wide.addEventListener("change", updateLayout);
    large.addEventListener("change", updateLayout);
    medium.addEventListener("change", updateLayout);

    return () => {
      mobile.removeEventListener("change", updateLayout);
      wide.removeEventListener("change", updateLayout);
      large.removeEventListener("change", updateLayout);
      medium.removeEventListener("change", updateLayout);
    };
  }, []);

  return layout;
}

function FeatureIconBadge({ iconKey }: { iconKey: FeatureHighlightIconKey }) {
  const Icon = featureIcons[iconKey] ?? Sparkles;

  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full",
        "bg-[radial-gradient(circle_at_50%_32%,rgba(59,130,246,0.32),rgba(30,64,175,0.12)_58%,rgba(15,23,42,0.28)_100%)]",
        "shadow-[0_0_18px_-14px_rgba(59,130,246,0.38)]",
      )}
    >
      <Icon className="size-5 text-primary" strokeWidth={1.5} aria-hidden />
    </span>
  );
}

function FeatureCard({
  feature,
  stacked,
}: {
  feature: FeatureHighlight;
  stacked?: boolean;
}) {
  return (
    <article
      data-feature-card
      className={cn(
        "flex shrink-0 flex-col rounded-xl border border-border/50 bg-card/35 p-5",
        stacked ? "w-full" : "h-full w-[var(--feature-card-width)]",
        !stacked && "lg:min-h-[15rem] xl:min-h-[15.5rem]",
      )}
    >
      <div className="flex items-center justify-start gap-3 sm:flex-col sm:items-start sm:justify-start">
        <FeatureIconBadge iconKey={feature.iconKey} />
        <h3 className="text-left text-sm font-semibold leading-snug text-foreground sm:mt-5">
          {feature.title}
        </h3>
      </div>
      <p className="mt-4 flex-1 text-left text-xs leading-5 text-muted-foreground sm:mt-2">
        {feature.description}
      </p>
    </article>
  );
}

function CarouselNavButton({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid size-9 place-items-center rounded-lg border border-border/60 bg-card/40 text-foreground transition-colors",
        "hover:border-border hover:bg-card/70",
        "disabled:cursor-not-allowed disabled:opacity-35",
      )}
    >
      <Icon className="size-4" strokeWidth={2} />
    </button>
  );
}

function CarouselControls({
  activeIndex,
  maxIndex,
  slideCount,
  onPrev,
  onNext,
}: {
  activeIndex: number;
  maxIndex: number;
  slideCount: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <CarouselNavButton
        direction="prev"
        disabled={activeIndex === 0}
        onClick={onPrev}
        label="Previous feature"
      />

      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: slideCount }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-0.5 rounded-full transition-all duration-300",
              index === activeIndex ? "w-6 bg-primary" : "w-3 bg-border/80",
            )}
          />
        ))}
      </div>

      <CarouselNavButton
        direction="next"
        disabled={activeIndex >= maxIndex}
        onClick={onNext}
        label="Next feature"
      />
    </div>
  );
}

export function FeaturesCarousel({ content }: { content: FeaturesContent }) {
  const reducedMotion = useReducedMotion();
  const { mode, visibleCount } = useCarouselLayout();
  const isMobileStack = mode === "mobile-stack";
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [stepPx, setStepPx] = useState(0);

  const slideCount = isMobileStack
    ? Math.ceil(content.features.length / 2)
    : Math.max(1, content.features.length - visibleCount + 1);
  const maxIndex = slideCount - 1;

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    function measureStep() {
      const viewportWidth = viewport.offsetWidth;

      if (isMobileStack) {
        viewport.style.setProperty("--feature-slide-width", `${viewportWidth}px`);
        setStepPx(viewportWidth);
        return;
      }

      const cardWidth = (viewportWidth - (visibleCount - 1) * CARD_GAP_PX) / visibleCount;
      viewport.style.setProperty("--feature-card-width", `${cardWidth}px`);
      setStepPx(cardWidth + CARD_GAP_PX);
    }

    measureStep();
    const observer = new ResizeObserver(measureStep);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [isMobileStack, visibleCount, content.features.length]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((current) => Math.max(0, current - 1));
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((current) => Math.min(maxIndex, current + 1));
  }, [maxIndex]);

  useEffect(() => {
    if (hoverPaused || maxIndex === 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [hoverPaused, maxIndex]);

  return (
    <div
      className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-10 xl:gap-12"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
      <div className="shrink-0 space-y-4 lg:max-w-[16.5rem] xl:max-w-[18rem]">
        <h2 className="text-pretty text-[38px] font-semibold leading-[1.1] tracking-[-0.03em]">
          <span className="block text-foreground">{content.titleBefore}</span>
          <span className="block text-primary">{content.titleHighlight}</span>
        </h2>
        <p className="text-pretty text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
          {content.description}
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div ref={viewportRef} className="min-w-0 overflow-hidden">
          <motion.div
            className="flex items-stretch"
            style={{ gap: isMobileStack ? 0 : CARD_GAP_PX }}
            animate={{ x: -activeIndex * stepPx }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            }
          >
            {isMobileStack
              ? Array.from({ length: slideCount }).map((_, slideIndex) => {
                  const firstCardIndex = slideIndex * 2;

                  return (
                    <div
                      key={slideIndex}
                      className="flex w-[var(--feature-slide-width)] shrink-0 flex-col gap-4"
                    >
                      <FeatureCard feature={content.features[firstCardIndex]} stacked />
                      {content.features[firstCardIndex + 1] ? (
                        <FeatureCard feature={content.features[firstCardIndex + 1]} stacked />
                      ) : null}
                    </div>
                  );
                })
              : content.features.map((feature) => (
                  <FeatureCard key={feature.title} feature={feature} />
                ))}
          </motion.div>
        </div>

        <CarouselControls
          activeIndex={activeIndex}
          maxIndex={maxIndex}
          slideCount={slideCount}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    </div>
  );
}
