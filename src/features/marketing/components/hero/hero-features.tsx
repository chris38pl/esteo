"use client";

import { motion } from "framer-motion";

import type { HeroFeature } from "@/features/marketing/components/hero/hero-content";
import { cn } from "@/lib/utils";

const featureIconSrc = [
  "/images/marketing/hero-features/ai.png",
  "/images/marketing/hero-features/control.png",
  "/images/marketing/hero-features/pdf.png",
  "/images/marketing/hero-features/payments.png",
] as const;

const iconGridVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.13,
      delayChildren: 0.08,
    },
  },
};

const iconVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.88 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.52,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function HeroFeatures({ features }: { features: HeroFeature[] }) {
  return (
    <div
      id="workflow"
      className={cn(
        "relative z-30 overflow-hidden bg-card/95 shadow-md backdrop-blur-md",
        "-mx-5 w-[calc(100%+2.5rem)] rounded-none border-x-0 border-y border-border/50",
        "sm:mx-0 sm:w-full sm:min-h-[11.25rem] sm:rounded-2xl sm:border",
        "lg:min-h-[7.75rem]",
      )}
    >
      <motion.div
        className="grid h-full divide-y divide-border/40 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={iconGridVariants}
      >
        {features.map((feature, index) => {
          const iconSrc = featureIconSrc[index] ?? featureIconSrc[0];

          return (
            <article
              key={feature.title}
              className={cn(
                "relative flex items-center gap-4 px-5 py-5 sm:gap-4 sm:px-6 sm:py-7",
                index >= 2 && "sm:border-t sm:border-border/40",
                index < features.length - 1 && [
                  "after:absolute after:right-0 after:top-1/2 after:hidden after:h-3/4 after:w-px after:-translate-y-1/2 after:bg-border/40",
                  index % 2 === 0 && "sm:after:block",
                  "lg:after:block",
                ],
              )}
            >
              <motion.div variants={iconVariants} className="size-12 shrink-0 sm:size-14">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={iconSrc}
                  alt=""
                  width={56}
                  height={56}
                  className="size-full rounded-[0.7rem] object-cover"
                  draggable={false}
                />
              </motion.div>
              <div className="min-w-0 space-y-2.5 py-0.5">
                <h2 className="text-sm font-semibold leading-snug tracking-tight text-foreground sm:text-[15px]">
                  {feature.title}
                </h2>
                <p className="text-xs font-normal leading-5 text-muted-foreground sm:text-[13px] sm:leading-[1.5]">
                  {feature.description}
                </p>
              </div>
            </article>
          );
        })}
      </motion.div>
    </div>
  );
}
