"use client";

import { usePathname } from "next/navigation";

import { TrackedFooterLink } from "@/features/marketing/components/tracked-footer-link";
import type { MarketingNavigationItem } from "@/features/marketing/lib/navigation";
import type { Locale } from "@/lib/locale";

export function FooterLinkList({
  items,
  locale,
}: {
  items: MarketingNavigationItem[];
  locale: Locale;
}) {
  const pathname = usePathname();
  const page = pathname ?? "unknown";

  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item.id}>
          <TrackedFooterLink href={item.href} locale={locale} page={page} target={item.id}>
            {item.label}
          </TrackedFooterLink>
        </li>
      ))}
    </ul>
  );
}
