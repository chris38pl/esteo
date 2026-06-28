import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MarketingContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
};

const sizeClassName: Record<NonNullable<MarketingContainerProps["size"]>, string> = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
};

export function MarketingContainer({
  children,
  className,
  size = "default",
}: MarketingContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-8", sizeClassName[size], className)}>
      {children}
    </div>
  );
}
