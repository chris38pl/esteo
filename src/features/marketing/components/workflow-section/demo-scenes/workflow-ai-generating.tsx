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
    <div className="overflow-hidden rounded-lg bg-card/40 p-2.5">
      <div className="flex items-center gap-2">
        <SkeletonBar className="size-3 shrink-0" />
        <SkeletonBar className="h-3 flex-1 max-w-[52%]" />
        <SkeletonBar className="ml-auto h-3 w-[30%] shrink-0" />
      </div>
      {expanded ? (
        <div className="mt-2.5 space-y-2 pt-2">
          {Array.from({ length: lineCount }).map((_, index) => (
            <SkeletonBar
              key={index}
              className={cn("h-3", index === lineCount - 1 ? "w-10/12" : "w-full")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function WorkflowAiGenerating() {
  const t = useTranslations("estimates");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-normal leading-snug text-primary">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            {t("editor.generating")}
          </p>
        </div>
      </div>

      <div className="mb-3 rounded-xl bg-card/30 p-3">
        <SkeletonBar className="mb-2.5 h-3 w-[38%]" />
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBar className="h-3 w-[34%]" />
            <SkeletonBar className="h-3 w-[28%]" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <SkeletonBar className="h-3 w-[30%]" />
            <SkeletonBar className="h-3 w-[24%]" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <SkeletonBar className="h-3.5 w-[36%]" />
            <SkeletonBar className="h-3.5 w-[32%]" />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-2.5">
        <SkeletonSection expanded lineCount={2} />
        <SkeletonSection />
      </div>
    </div>
  );
}
