import {
  Clock,
  FileSearch,
  Frown,
  UserX,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

import type {
  ProblemBubble,
  ProblemBubbleIconKey,
  ProblemContent,
  ProblemFeature,
  ProblemFeatureIconKey,
} from "@/features/marketing/components/problem-section/problem-data";
import { ProblemChatBubble } from "@/features/marketing/components/problem-section/problem-chat-bubble";
import { cn } from "@/lib/utils";

const bubbleIcons: Record<ProblemBubbleIconKey, LucideIcon> = {
  frown: Frown,
  "file-search": FileSearch,
  "user-x": UserX,
  clock: Clock,
};

const featureIconSrcs: Record<ProblemFeatureIconKey, string> = {
  database: "/images/marketing/problem/features/database.webp",
  calculator: "/images/marketing/problem/features/calculator.webp",
  users: "/images/marketing/problem/features/users.webp",
  "file-x": "/images/marketing/problem/features/file-x.webp",
};

function ProblemFeatureIcon({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={72}
      height={72}
      className="size-14 object-contain sm:size-16"
      aria-hidden
    />
  );
}

export function ProblemVisual({
  content,
  className,
}: {
  content: ProblemContent;
  className?: string;
}) {
  return (
    <div className={cn("relative flex h-full min-h-0 w-full items-center", className)}>
      <ProblemChatBubbles
        bubbles={content.bubbles}
        className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 lg:flex"
      />

      <div className="relative z-0 flex h-full w-full min-h-0 items-center justify-center lg:justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.imageSrc}
          alt={content.imageAlt}
          className="h-auto max-h-[17rem] w-full max-w-[min(100%,21rem)] object-contain sm:max-h-[18.5rem] sm:max-w-[23rem] lg:h-auto lg:max-h-[min(100%,21rem)] lg:w-auto lg:max-w-[78%] xl:max-h-[min(100%,22rem)] xl:max-w-[74%]"
          draggable={false}
        />
      </div>
    </div>
  );
}

function ProblemChatBubbles({
  bubbles,
  className,
}: {
  bubbles: ProblemBubble[];
  className?: string;
}) {
  const offsets = [
    "translate-x-0",
    "-translate-x-5 xl:-translate-x-6",
    "-translate-x-6 xl:-translate-x-7",
    "translate-x-2",
  ];

  return (
    <ul
      className={cn(
        "flex max-w-[12rem] flex-col items-start gap-6",
        className,
      )}
      aria-label="Pain points"
    >
      {bubbles.map((bubble, index) => {
        const Icon = bubbleIcons[bubble.iconKey] ?? Frown;

        return (
          <li key={`${bubble.line1}-${bubble.line2}`} className={cn("flex justify-start", offsets[index])}>
            <ProblemChatBubble
              icon={Icon}
              line1={bubble.line1}
              line2={bubble.line2}
              showTail
            />
          </li>
        );
      })}
    </ul>
  );
}

export function ProblemHeadline({
  content,
  className,
}: {
  content: ProblemContent;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 text-center lg:text-left", className)}>
      <h2 className="text-pretty text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
        {content.titleBefore}
        <span className="text-red-400">{content.titleHighlight}</span>
        {content.titleAfter}
      </h2>
      <p className="mx-auto max-w-lg text-pretty text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 lg:mx-0">
        {content.description}
      </p>
    </div>
  );
}

export function ProblemFeatureGrid({
  features,
  className,
}: {
  features: ProblemFeature[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-5 xl:gap-x-6",
        className,
      )}
    >
      {features.map((feature) => {
        const iconSrc = featureIconSrcs[feature.iconKey];

        return (
          <article key={feature.title} className="flex flex-col items-center text-center">
            <span
              className={cn(
                "relative isolate mb-4 flex items-center justify-center rounded-[0.7rem] p-3.5",
                "sm:mb-[1.125rem] sm:rounded-[0.75rem] sm:p-4",
                "after:pointer-events-none after:absolute after:left-1/2 after:top-[58%] after:-z-10 after:h-10 after:w-[88%] after:-translate-x-1/2 after:rounded-full",
                "after:bg-[radial-gradient(ellipse_at_center,rgba(248,113,113,0.28),transparent_72%)] after:blur-md",
              )}
            >
              <ProblemFeatureIcon src={iconSrc} />
            </span>
            <h3 className="text-xs font-semibold leading-snug text-foreground sm:text-sm">
              {feature.title}
            </h3>
            <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground sm:mt-2 sm:text-xs sm:leading-5">
              {feature.description}
            </p>
          </article>
        );
      })}
    </div>
  );
}
