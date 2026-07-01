import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import "./hero-phone-compact.css";

/** Dark-theme app UI scaled for the marketing phone screen cutout. */
export function HeroPhoneAppSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "hero-phone-app-surface dark relative isolate h-full overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
