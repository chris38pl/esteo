"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-foreground/12 dark:bg-muted/55", className)}
      aria-hidden
    />
  );
}

function SkeletonSection({
  expanded,
  lineCount = 2,
}: {
  expanded?: boolean;
  lineCount?: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-card/40 p-2">
      <div className="flex items-center gap-2">
        <SkeletonBar className="size-2.5 shrink-0" />
        <SkeletonBar className="h-2.5 flex-1 max-w-[52%]" />
        <SkeletonBar className="ml-auto h-2.5 w-[30%] shrink-0" />
      </div>
      {expanded ? (
        <div className="mt-2 space-y-1.5 pt-2">
          {Array.from({ length: lineCount }).map((_, index) => (
            <SkeletonBar
              key={index}
              className={cn("h-2.5", index === lineCount - 1 ? "w-10/12" : "w-full")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function HeroPhoneGeneratingScreen() {
  const t = useTranslations("estimates");

  return (
    <div className="hero-phone-generating flex h-full flex-col pb-3 pl-[15px] pr-2.5 pt-3.5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] font-normal leading-snug text-primary">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            {t("editor.generating")}
          </p>
        </div>
      </div>

      <div className="mb-2.5 rounded-xl bg-card/30 p-2.5">
        <SkeletonBar className="mb-2 h-2.5 w-[38%]" />
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBar className="h-2.5 w-[34%]" />
            <SkeletonBar className="h-2.5 w-[28%]" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <SkeletonBar className="h-2.5 w-[30%]" />
            <SkeletonBar className="h-2.5 w-[24%]" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <SkeletonBar className="h-3 w-[36%]" />
            <SkeletonBar className="h-3 w-[32%]" />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5">
        <SkeletonSection expanded lineCount={3} />
        <SkeletonSection />
        <SkeletonSection />
        <SkeletonSection />

        <div className="mt-auto space-y-2 pt-2">
          <div className="rounded-lg bg-card/35 p-2">
            <SkeletonBar className="mb-2 h-2.5 w-[42%]" />
            <SkeletonBar className="h-2.5 w-full" />
            <SkeletonBar className="mt-1.5 h-2.5 w-11/12" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBar className="h-3 flex-1 rounded-lg" />
            <SkeletonBar className="h-8 w-[34%] shrink-0 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
