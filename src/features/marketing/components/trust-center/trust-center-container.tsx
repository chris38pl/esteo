import type { ReactNode } from "react";

import { MarketingContainer } from "@/features/marketing/components/container";
import { cn } from "@/lib/utils";

type TrustCenterContainerProps = {
  children: ReactNode;
  className?: string;
};

export function TrustCenterContainer({ children, className }: TrustCenterContainerProps) {
  return (
    <MarketingContainer size="wide" className={cn("py-14 sm:py-20", className)}>
      {children}
    </MarketingContainer>
  );
}
