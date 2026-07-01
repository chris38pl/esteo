"use client";

import { motion } from "framer-motion";
import { FileText, Sparkles, Table2, Wallet, type LucideIcon } from "lucide-react";

import type { HeroFeature } from "@/features/marketing/components/hero/hero-content";
import { cn } from "@/lib/utils";

const featureIcons: LucideIcon[] = [Sparkles, Table2, FileText, Wallet];

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

function HeroFeatureIcon({ Icon }: { Icon: LucideIcon }) {
  return (
    <span
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-full sm:size-14",
        "bg-[radial-gradient(circle_at_50%_32%,rgba(59,130,246,0.32),rgba(30,64,175,0.12)_58%,rgba(15,23,42,0.28)_100%)]",
        "shadow-[0_0_18px_-14px_rgba(59,130,246,0.38)]",
      )}
    >
      <Icon className="size-5 text-primary sm:size-6" strokeWidth={1.5} aria-hidden />
    </span>
  );
}

export function HeroFeatures({ features }: { features: HeroFeature[] }) {
  return (
    <div
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
          const Icon = featureIcons[index] ?? Sparkles;

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
              <motion.div variants={iconVariants}>
                <HeroFeatureIcon Icon={Icon} />
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
