import {
  Ban,
  BarChart3,
  Brain,
  ClipboardCheck,
  Globe,
  Lock,
  Mail,
  PanelTop,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  User,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import type { LegalHighlightCard } from "@/features/marketing/components/trust-center/trust-types";
import { cn } from "@/lib/utils";

const highlightIcons: Record<string, LucideIcon> = {
  "no-sell": Lock,
  "no-ai-training": Brain,
  providers: ShieldCheck,
  "delete-account": User,
  contact: Mail,
  essential: Shield,
  functional: Globe,
  analytics: BarChart3,
  "consent-banner": PanelTop,
  "no-ads": Ban,
  "browser-settings": Settings,
  "ai-draft": Sparkles,
  "user-decision": UserCheck,
  verify: ClipboardCheck,
  "no-guarantee": TriangleAlert,
  "data-models": Brain,
};

const layoutClassName = {
  "grid-3": "sm:grid-cols-2 lg:grid-cols-3",
  "grid-5": "sm:grid-cols-2 lg:grid-cols-5",
};

type TrustHighlightCardStripProps = {
  items: LegalHighlightCard[];
  heading?: string;
  layout?: "grid-3" | "grid-5";
  cardStyle?: "default" | "highlight";
};

function HighlightCard({ item }: { item: LegalHighlightCard }) {
  const Icon = item.id ? (highlightIcons[item.id] ?? ShieldCheck) : null;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-primary/20 bg-card/35 px-4 py-5 sm:items-center sm:py-6 sm:text-center",
        "shadow-[0_0_28px_-14px_rgba(59,130,246,0.35),inset_0_1px_0_0_rgba(255,255,255,0.03)]",
      )}
    >
      <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-0">
        {Icon ? (
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-xl",
              "bg-[radial-gradient(circle_at_50%_32%,rgba(59,130,246,0.28),rgba(30,64,175,0.1)_58%,rgba(15,23,42,0.24)_100%)]",
            )}
          >
            <Icon className="size-6 text-sky-400" strokeWidth={1.5} aria-hidden />
          </span>
        ) : null}
        <h2 className="text-sm font-semibold leading-snug text-foreground sm:mt-4">{item.title}</h2>
      </div>
      {item.description ? (
        <p className="mt-3 text-xs leading-5 text-muted-foreground sm:mt-2 sm:text-center sm:text-[13px] sm:leading-6">
          {item.description}
        </p>
      ) : null}
    </article>
  );
}

function DefaultHighlightCard({ item }: { item: LegalHighlightCard }) {
  return (
    <article
      className={cn(
        "rounded-xl border border-border/45 bg-card/35 p-5",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
      )}
    >
      <h2 className="text-sm font-semibold leading-snug text-foreground sm:text-[0.9375rem]">
        {item.title}
      </h2>
      {item.description ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
          {item.description}
        </p>
      ) : null}
    </article>
  );
}

export function TrustHighlightCardStrip({
  items,
  heading,
  layout = "grid-3",
  cardStyle = "default",
}: TrustHighlightCardStripProps) {
  const useHighlightCards = cardStyle === "highlight" || layout === "grid-5";

  return (
    <section className="space-y-4">
      {heading ? (
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{heading}</h2>
      ) : null}
      <div className={cn("grid gap-4", layoutClassName[layout])}>
        {items.map((item) =>
          useHighlightCards ? (
            <HighlightCard key={item.id ?? item.title} item={item} />
          ) : (
            <DefaultHighlightCard key={item.id ?? item.title} item={item} />
          ),
        )}
      </div>
    </section>
  );
}
