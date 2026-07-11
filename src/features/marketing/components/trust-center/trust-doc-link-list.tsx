import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { TrustDocLink } from "@/features/marketing/components/trust-center/trust-types";
import { cn } from "@/lib/utils";

export function TrustDocLinkList({ heading, links }: { heading: string; links: TrustDocLink[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {heading}
      </h2>
      <ul className="overflow-hidden rounded-xl border border-border/35">
        {links.map((link, index) => (
          <li key={link.href} className={cn(index > 0 && "border-t border-border/35")}>
            <Link
              href={link.href}
              className="group flex items-center justify-between gap-4 px-4 py-3.5 text-sm transition hover:bg-muted/40 sm:px-5 sm:py-4"
            >
              <span className="font-medium text-foreground">{link.label}</span>
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
