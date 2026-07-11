import { Check } from "lucide-react";
import Image from "next/image";

import type { LegalChecklistItem } from "@/features/marketing/components/trust-center/trust-types";
import { cn } from "@/lib/utils";

type TrustRulesChecklistProps = {
  items: LegalChecklistItem[];
  imageSrc?: string;
  imageAlt?: string;
};

function ChecklistItems({ items }: { items: LegalChecklistItem[] }) {
  return (
    <ul className="space-y-5 sm:space-y-6">
      {items.map((item) => (
        <li key={item.text} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="text-sm leading-6 text-foreground sm:text-[0.9375rem] sm:leading-7">
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TrustRulesChecklist({ items, imageSrc, imageAlt = "" }: TrustRulesChecklistProps) {
  if (!imageSrc) {
    return <ChecklistItems items={items} />;
  }

  return (
    <div className="relative lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center lg:gap-10">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 flex items-center justify-end lg:hidden",
        )}
        aria-hidden
      >
        <div className="relative h-[24rem] w-[min(78vw,20rem)] shrink-0 sm:h-[26rem] sm:w-[min(72vw,22rem)]">
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="(max-width: 1024px) 78vw, 0px"
            className="object-contain object-right opacity-80"
          />
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-background from-[42%] via-background/95 via-[58%] to-transparent lg:hidden"
        aria-hidden
      />

      <div className="relative z-10 min-w-0 pr-2">
        <ChecklistItems items={items} />
      </div>

      <div className="relative mx-auto hidden w-full max-w-sm overflow-hidden rounded-xl sm:max-w-md lg:block lg:mx-0 lg:ml-auto lg:max-w-none">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={640}
          height={480}
          className="h-auto w-full object-contain opacity-80"
        />
      </div>
    </div>
  );
}
