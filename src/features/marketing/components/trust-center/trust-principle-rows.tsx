import type { LegalPrincipleRow } from "@/features/marketing/components/trust-center/trust-types";

export function TrustPrincipleRows({ items }: { items: LegalPrincipleRow[] }) {
  return (
    <div className="divide-y divide-border/35 overflow-hidden rounded-xl border border-border/45 bg-card/25">
      {items.map((item) => (
        <article key={item.title} className="px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground sm:text-[0.9375rem]">{item.title}</h2>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
            {item.description}
          </p>
        </article>
      ))}
    </div>
  );
}
