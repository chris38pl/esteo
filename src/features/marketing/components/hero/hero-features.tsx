"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import type { HeroFeature } from "@/features/marketing/components/hero/hero-content";
import { cn } from "@/lib/utils";

const featureIconSrcs = [
  "/images/marketing/hero-features/ai.webp",
  "/images/marketing/hero-features/control.webp",
  "/images/marketing/hero-features/pdf.webp",
  "/images/marketing/hero-features/payments.webp",
] as const;

// Normalize perceived size — source art fills each canvas differently.
const featureIconScales = [1, 1.12, 0.9, 1.06] as const;

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
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

function HeroFeatureIcon({ src, scale }: { src: string; scale: number }) {
  return (
    <span
      className={cn(
        "relative isolate grid shrink-0 place-items-center",
        "size-14 sm:size-[4.25rem] lg:size-20",
        "after:pointer-events-none after:absolute after:left-1/2 after:top-[58%] after:-z-10 after:h-10 after:w-[88%] after:-translate-x-1/2 after:rounded-full",
        "after:bg-[radial-gradient(ellipse_at_center,rgba(96,165,250,0.28),transparent_72%)] after:blur-md",
      )}
    >
      <Image
        src={src}
        alt=""
        width={80}
        height={80}
        className="relative z-10 size-full object-contain"
        style={scale === 1 ? undefined : { transform: `scale(${scale})` }}
        aria-hidden
      />
    </span>
  );
}

export function HeroFeatures({ features }: { features: HeroFeature[] }) {
  return (
    <div
      className={cn(
        "relative z-30 overflow-hidden bg-card/95 shadow-md backdrop-blur-md",
        "-mx-5 w-[calc(100%+2.5rem)] rounded-none border-x-0 border-y border-border/50",
        "sm:mx-0 sm:w-full sm:min-h-[11.5rem] sm:rounded-2xl sm:border",
        "lg:min-h-[8.5rem]",
      )}
    >
      <motion.div
        className="grid h-full divide-y divide-border/40 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={iconGridVariants}
      >
        {features.map((feature, index) => {
          const iconSrc = featureIconSrcs[index] ?? featureIconSrcs[0];
          const iconScale = featureIconScales[index] ?? 1;

          return (
            <article
              key={feature.title}
              className={cn(
                "relative flex items-center gap-3.5 px-5 py-5 sm:gap-4 sm:px-6 sm:py-6",
                index >= 2 && "sm:border-t sm:border-border/40",
                index < features.length - 1 && [
                  "after:absolute after:right-0 after:top-1/2 after:hidden after:h-3/4 after:w-px after:-translate-y-1/2 after:bg-border/40",
                  index % 2 === 0 && "sm:after:block",
                  "lg:after:block",
                ],
              )}
            >
              <motion.div variants={iconVariants} className="shrink-0">
                <HeroFeatureIcon src={iconSrc} scale={iconScale} />
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
