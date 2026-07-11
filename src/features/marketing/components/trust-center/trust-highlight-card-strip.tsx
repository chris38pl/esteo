import type { LegalHighlightCard } from "@/features/marketing/components/trust-center/trust-types";
import { cn } from "@/lib/utils";

export function TrustHighlightCardStrip({ items }: { items: LegalHighlightCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
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
      ))}
    </div>
  );
}
