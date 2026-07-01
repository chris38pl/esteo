import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MarketingSectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: "default" | "muted" | "card";
};

const variantClassName: Record<NonNullable<MarketingSectionProps["variant"]>, string> = {
  default: "bg-background",
  muted: "bg-muted/35",
  card: "bg-card/40",
};

export function MarketingSection({
  children,
  className,
  id,
  variant = "default",
}: MarketingSectionProps) {
  return (
    <section id={id} className={cn("py-14 sm:py-20", variantClassName[variant], className)}>
      {children}
    </section>
  );
}
