import { Check } from "lucide-react";
import Image from "next/image";

import type {
  TrustPromise,
  TrustPromiseAccent,
} from "@/features/marketing/components/trust-center/trust-types";
import { cn } from "@/lib/utils";

const accentStyles: Record<TrustPromiseAccent, string> = {
  blue: "bg-sky-500/15 text-sky-400",
  teal: "bg-teal-500/15 text-teal-400",
  purple: "bg-violet-500/15 text-violet-400",
};

function PromiseHeading({ promise }: { promise: TrustPromise }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full",
          accentStyles[promise.accent],
        )}
      >
        <Check className="size-3 stroke-[3]" aria-hidden />
      </span>
      <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base">
        {promise.title}
      </h3>
    </div>
  );
}

function PromiseIcon({
  promise,
  className,
}: {
  promise: TrustPromise;
  className?: string;
}) {
  return (
    <Image
      src={promise.iconSrc}
      alt=""
      width={96}
      height={96}
      className={cn("h-auto w-auto object-contain", className)}
      aria-hidden
    />
  );
}

export function TrustPromisesSection({
  titleBefore,
  titleHighlight,
  subtitle,
  promises,
}: {
  titleBefore: string;
  titleHighlight: string;
  subtitle: string;
  promises: TrustPromise[];
}) {
  return (
    <section className="space-y-6 sm:space-y-8">
      <div className="mx-auto max-w-3xl space-y-3 text-center">
        <h2 className="text-pretty text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-4xl">
          <span>{titleBefore}</span>
          <span className="text-primary">{titleHighlight}</span>
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
          {subtitle}
        </p>
      </div>

      <div className="divide-y divide-border/40">
        {promises.map((promise) => (
          <article key={promise.id} className="py-5 first:pt-0 last:pb-0 sm:py-6">
            <div className="sm:hidden">
              <div className="flex items-center gap-4">
                <PromiseIcon promise={promise} className="size-16 shrink-0" />
                <PromiseHeading promise={promise} />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{promise.description}</p>
            </div>

            <div className="hidden items-center gap-6 sm:flex lg:gap-8">
              <PromiseIcon promise={promise} className="size-20 shrink-0 lg:size-[5.5rem]" />
              <div className="min-w-0 flex-1 space-y-2">
                <PromiseHeading promise={promise} />
                <p className="text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
                  {promise.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
