"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import "./phone-screen.css";

const PHONE_FRAME_SRC = "/images/marketing-phone-hand.webp";

const screenShellClassName =
  "phone-screen-shell absolute left-[calc(23.2%+3px)] top-[calc(8.8%+4px)] z-30 h-[calc(65.8%-8px)] w-[calc(48.8%-6px)] lg:z-10";

export function PhoneFrame({ children, reducedMotion }: { children: ReactNode; reducedMotion: boolean }) {
  return (
    <div
      className={cn(
        "phone-frame-root relative mx-auto w-[min(104vw,35rem)] sm:w-[min(92vw,35rem)]",
        "max-[499px]:left-1/2 max-[499px]:mx-0 max-[499px]:w-[32.5rem] max-[499px]:max-w-none max-[499px]:shrink-0",
        "max-[499px]:-translate-x-[calc(23.2%+3px+(48.8%-6px)/2)]",
        "lg:mx-0 lg:left-auto lg:w-auto lg:translate-x-0 lg:flex lg:h-full lg:items-end lg:justify-end",
      )}
    >
      <div
        aria-hidden
        className="absolute left-[17%] top-[6%] h-[72%] w-[54%] rounded-[3rem] bg-blue-500/10 blur-3xl lg:bg-blue-500/20"
      />

      <motion.div
        initial={false}
        animate={reducedMotion ? undefined : { y: -5 }}
        whileHover={reducedMotion ? undefined : { y: -9, scale: 1.004 }}
        transition={
          reducedMotion
            ? undefined
            : {
                y: {
                  duration: 4.5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: [0.45, 0, 0.55, 1],
                },
                scale: {
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                },
              }
        }
        className="relative z-10 h-full w-full drop-shadow-[0_40px_90px_rgba(0,0,0,0.55)] will-change-transform lg:w-auto"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="relative mx-auto aspect-[682/1024] w-full lg:mx-0 lg:aspect-auto lg:h-full lg:w-fit">
          <div className={screenShellClassName}>
            <div className="phone-screen-safe-area">{children}</div>
          </div>

          {/* Hand + bezel overlay - optional visual; layout works without it */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PHONE_FRAME_SRC}
            alt=""
            width={682}
            height={1024}
            decoding="async"
            className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none object-contain lg:relative lg:h-full lg:w-auto lg:max-h-none"
            draggable={false}
          />
        </div>
      </motion.div>
    </div>
  );
}
