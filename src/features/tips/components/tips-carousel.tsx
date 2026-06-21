"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { TipCard } from "@/features/tips/components/tip-card";
import {
  buildTipsCarouselSlides,
  countTipsInSlides,
} from "@/features/tips/lib/build-tips-carousel-slides";
import { TIP_CARD_STYLES } from "@/features/tips/lib/tip-card-styles";
import { getTipHref, type TipCatalogEntry, type TipId } from "@/features/tips/lib/tips-catalog";
import type { ToggleTipPinResult } from "@/features/tips/lib/tips-storage";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_MS = 6000;

interface TipsCarouselProps {
  tips: TipCatalogEntry[];
  locale: Locale;
  workspaceSlug: string;
  userId: string | null;
  pinnedIds?: TipId[];
  dismissedIds?: TipId[];
  showIndex?: boolean;
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
  enableDismiss?: boolean;
  enablePin?: boolean;
  onDismissTip?: (tipId: TipId) => void;
  onPinToggle?: (tipId: TipId) => ToggleTipPinResult;
}

export function TipsCarousel({
  tips,
  locale,
  workspaceSlug,
  userId,
  pinnedIds = [],
  dismissedIds = [],
  showIndex = true,
  autoPlay = true,
  autoPlayIntervalMs = AUTO_ADVANCE_MS,
  enableDismiss = false,
  enablePin = false,
  onDismissTip,
  onPinToggle,
}: TipsCarouselProps) {
  const t = useTranslations("tips");
  const tCarousel = useTranslations("tips.carousel");
  const reduceMotion = useReducedMotion();

  const slides = useMemo(
    () =>
      buildTipsCarouselSlides(tips, {
        pinnedIds,
        dismissedIds,
      }),
    [tips, pinnedIds, dismissedIds],
  );

  const slidesKey = slides.map((slide) => slide.map((tip) => tip.id).join("-")).join("|");

  const [slideIndex, setSlideIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const slideIndexRef = useRef(slideIndex);

  const slideCount = slides.length;
  const autoplayPaused = hoverPaused || tabHidden;

  slideIndexRef.current = slideIndex;

  const goToSlide = useCallback(
    (nextIndex: number) => {
      if (slideCount === 0) {
        return;
      }
      setSlideIndex(((nextIndex % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => {
    goToSlide(slideIndexRef.current + 1);
  }, [goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(slideIndexRef.current - 1);
  }, [goToSlide]);

  useEffect(() => {
    setSlideIndex(0);
  }, [slidesKey]);

  useEffect(() => {
    if (slideIndex >= slideCount) {
      setSlideIndex(0);
    }
  }, [slideCount, slideIndex]);

  useEffect(() => {
    function handleVisibilityChange() {
      setTabHidden(document.hidden);
    }

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!autoPlay || reduceMotion || autoplayPaused || slideCount <= 1) {
      return;
    }

    const timer = window.setInterval(goNext, autoPlayIntervalMs);
    return () => window.clearInterval(timer);
  }, [autoPlay, autoPlayIntervalMs, autoplayPaused, goNext, reduceMotion, slideCount]);

  function handleDismiss(tipId: TipId) {
    onDismissTip?.(tipId);
  }

  function handlePinToggle(tipId: TipId) {
    if (!onPinToggle) {
      return;
    }
    const result = onPinToggle(tipId);
    if (result === "max_reached") {
      toast.message(t("pin.maxReached"));
    }
  }

  if (countTipsInSlides(slides) === 0) {
    return null;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
    >
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: `-${slideIndex * 100}%` }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.55, ease: [0.4, 0, 0.2, 1] }
          }
        >
          {slides.map((slide, slideIdx) => {
            const slideKey = slide.map((tip) => tip.id).join("-");
            const slideOffset = slides.slice(0, slideIdx).reduce((total, item) => total + item.length, 0);

            return (
              <div
                key={slideKey}
                className="grid w-full shrink-0 grid-cols-1 gap-4 lg:grid-cols-3"
              >
                {slide.map((tip, tipIndex) => {
                  const isPinned = pinnedIds.includes(tip.id);

                  return (
                    <TipCard
                      key={tip.id}
                      index={showIndex ? slideOffset + tipIndex + 1 : undefined}
                      title={t(`cards.${tip.id}.title`)}
                      description={t(`cards.${tip.id}.description`)}
                      learnMoreLabel={t("learnMore")}
                      href={getTipHref(tip.id, locale, workspaceSlug)}
                      style={TIP_CARD_STYLES[tip.id]}
                      isPinned={isPinned}
                      pinnedBadgeLabel={isPinned ? t("card.pinnedBadge") : undefined}
                      onDismiss={
                        enableDismiss && onDismissTip ? () => handleDismiss(tip.id) : undefined
                      }
                      dismissLabel={t("card.dismiss")}
                      onPinToggle={
                        enablePin && onPinToggle ? () => handlePinToggle(tip.id) : undefined
                      }
                      pinLabel={t("card.pin")}
                      unpinLabel={t("card.unpin")}
                    />
                  );
                })}
              </div>
            );
          })}
        </motion.div>
      </div>

      {slideCount > 1 ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === slideIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
                aria-label={tCarousel("goToSlide", { slide: index + 1 })}
                aria-current={index === slideIndex ? "true" : undefined}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 rounded-lg border-border/70"
              onClick={goPrev}
              aria-label={tCarousel("previous")}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 rounded-lg border-border/70"
              onClick={goNext}
              aria-label={tCarousel("next")}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
