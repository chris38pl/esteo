import { ArrowRight, Brain, Cookie, Shield, type LucideIcon } from "lucide-react";
import Link from "next/link";

import type {
  TrustDocLink,
  TrustPromiseAccent,
} from "@/features/marketing/components/trust-center/trust-types";
import { cn } from "@/lib/utils";

const linkIcons: Record<string, LucideIcon> = {
  privacy: Shield,
  cookies: Cookie,
  ai: Brain,
};

const accentStyles: Record<
  TrustPromiseAccent,
  { shell: string; icon: string; arrow: string }
> = {
  blue: {
    shell:
      "bg-[radial-gradient(circle_at_50%_32%,rgba(59,130,246,0.28),rgba(30,64,175,0.1)_58%,rgba(15,23,42,0.24)_100%)]",
    icon: "text-sky-400",
    arrow: "text-sky-400",
  },
  teal: {
    shell:
      "bg-[radial-gradient(circle_at_50%_32%,rgba(45,212,191,0.28),rgba(15,118,110,0.1)_58%,rgba(15,23,42,0.24)_100%)]",
    icon: "text-teal-400",
    arrow: "text-teal-400",
  },
  purple: {
    shell:
      "bg-[radial-gradient(circle_at_50%_32%,rgba(167,139,250,0.28),rgba(109,40,217,0.1)_58%,rgba(15,23,42,0.24)_100%)]",
    icon: "text-violet-400",
    arrow: "text-violet-400",
  },
};

export function TrustDocLinkList({ heading, links }: { heading: string; links: TrustDocLink[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {heading}
      </h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {links.map((link) => {
          const Icon = linkIcons[link.id] ?? Shield;
          const accent = accentStyles[link.accent];

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-4 rounded-xl border border-border/45 bg-card/35 p-5",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] transition hover:border-border/70 hover:bg-card/50",
              )}
            >
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-xl",
                  accent.shell,
                )}
              >
                <Icon className={cn("size-6", accent.icon)} strokeWidth={1.5} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-foreground">{link.label}</h3>
                <p className="text-xs leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
                  {link.description}
                </p>
              </div>
              <ArrowRight
                className={cn(
                  "size-5 shrink-0 transition group-hover:translate-x-0.5",
                  accent.arrow,
                )}
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
