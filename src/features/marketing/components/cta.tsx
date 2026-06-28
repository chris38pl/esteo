import Link from "next/link";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

type MarketingCTAProps = Omit<ComponentProps<typeof Button>, "asChild"> & {
  href: string;
};

export function MarketingCTA({ href, children, ...props }: MarketingCTAProps) {
  return (
    <Button asChild {...props}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
