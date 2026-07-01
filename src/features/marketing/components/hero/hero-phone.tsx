"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { FloatingAssistant } from "@/features/marketing/components/hero/floating-assistant";
import { heroAnimationContent } from "@/features/marketing/components/hero/hero-animation-data";
import {
  getHeroPhonePhaseDuration,
  HERO_PHONE_PHASE,
  HERO_PHONE_PHASE_COUNT,
  isHeroAssistantModalOpen,
} from "@/features/marketing/components/hero/hero-phone-demo-data";
import { HeroPhoneScene } from "@/features/marketing/components/hero/hero-phone-scene";
import { PhoneFrame } from "@/features/marketing/components/hero/phone-frame";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const PHONE_FOG_SRC = "/images/marketing-phone-fog.webp";

function useHeroPhoneMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function HeroPhone({ locale }: { locale: Locale }) {
  const reducedMotion = useReducedMotion();
  const isMobile = useHeroPhoneMobile();
  const [phase, setPhase] = useState(0);
  const [cycle, setCycle] = useState(0);
  const content = heroAnimationContent[locale];
  const displayedPhase = reducedMotion ? HERO_PHONE_PHASE.TOAST_SUCCESS : phase;
  const assistantModalOpen = isHeroAssistantModalOpen(displayedPhase, isMobile);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const duration = getHeroPhonePhaseDuration(phase, isMobile);
    const timeout = window.setTimeout(() => {
      setPhase((currentPhase) => {
        const nextPhase = (currentPhase + 1) % HERO_PHONE_PHASE_COUNT;
        if (nextPhase === 0) {
          setCycle((currentCycle) => currentCycle + 1);
        }
        return nextPhase;
      });
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [phase, reducedMotion, isMobile]);

  return (
    <div
      className={cn(
        "relative z-[5] flex w-full flex-col overflow-visible pb-0 pt-2 sm:pt-2 lg:h-full lg:min-h-0 lg:pb-0 lg:pt-0",
        assistantModalOpen && "max-lg:z-50",
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-96 -translate-y-1/2 rounded-full bg-blue-500/[0.06] blur-3xl dark:bg-blue-400/[0.08] lg:inset-x-8 lg:top-16 lg:h-80 lg:translate-y-0 lg:bg-blue-500/15 lg:dark:bg-blue-400/20"
      />
      <div
        aria-hidden
        className="absolute right-6 top-1/3 h-56 w-56 rounded-full bg-violet-500/[0.05] blur-3xl lg:right-10 lg:top-28 lg:h-60 lg:w-60 lg:bg-violet-500/10"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible lg:items-end lg:justify-end"
      >
        <div className="relative -mb-[81px] w-full max-lg:overflow-x-clip sm:-mb-[97px] lg:mb-0 lg:h-full lg:w-auto lg:overflow-visible">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[52%] z-[1] w-[min(118vw,43rem)] max-w-none -translate-x-1/2 -translate-y-1/2 max-[499px]:w-[36.875rem] sm:w-[min(105vw,43rem)] lg:left-[58%] lg:top-[54%] lg:w-[50rem]"
            initial={false}
            animate={reducedMotion ? { opacity: 0.15 } : { opacity: [0.1, 0.2, 0.1] }}
            transition={
              reducedMotion
                ? undefined
                : {
                    opacity: {
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PHONE_FOG_SRC}
              alt=""
              width={704}
              height={704}
              className="h-auto w-full select-none"
              draggable={false}
            />
          </motion.div>
          <div className="hidden lg:block">
            <FloatingAssistant phase={displayedPhase} assistant={content.assistant} />
          </div>
          <PhoneFrame reducedMotion={Boolean(reducedMotion)}>
            <HeroPhoneScene key={cycle} phase={displayedPhase} locale={locale} isMobile={isMobile} />
          </PhoneFrame>
        </div>
      </motion.div>
    </div>
  );
}
