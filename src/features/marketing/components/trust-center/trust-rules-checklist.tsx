import { Check } from "lucide-react";

import type { LegalChecklistItem } from "@/features/marketing/components/trust-center/trust-types";

export function TrustRulesChecklist({ items }: { items: LegalChecklistItem[] }) {
  return (
    <ul className="space-y-3 rounded-xl border border-border/45 bg-card/35 p-5">
      {items.map((item) => (
        <li key={item.text} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="text-sm leading-6 text-foreground sm:text-[0.9375rem]">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
