import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { TrustHubCardItem } from "@/features/marketing/components/trust-center/trust-types";
import { TrustIconShell } from "@/features/marketing/components/trust-center/trust-icon-shell";
import { cn } from "@/lib/utils";

type TrustHubCardProps = {
  item: TrustHubCardItem;
  ctaLabel: string;
};

export function TrustHubCard({ item, ctaLabel }: TrustHubCardProps) {
  const Icon = item.icon;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-border/45 bg-card/35 px-6 py-8 sm:items-center sm:px-10 sm:py-10 sm:text-center",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
      )}
    >
      <div className="flex items-center gap-3 sm:hidden">
        <TrustIconShell Icon={Icon} />
        <h2 className="text-base font-semibold tracking-tight text-foreground">{item.title}</h2>
      </div>

      <TrustIconShell Icon={Icon} size="lg" className="hidden sm:grid" />

      <h2 className="mt-5 hidden text-base font-semibold tracking-tight text-foreground sm:block">
        {item.title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-muted-foreground sm:mt-2">{item.description}</p>

      <Link
        href={item.href}
        className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-primary/80 sm:mt-6"
      >
        {ctaLabel}
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </article>
  );
}

export function TrustHubGrid({
  items,
  ctaLabel,
}: {
  items: TrustHubCardItem[];
  ctaLabel: string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {items.map((item) => (
        <TrustHubCard key={item.id} item={item} ctaLabel={ctaLabel} />
      ))}
    </div>
  );
}
