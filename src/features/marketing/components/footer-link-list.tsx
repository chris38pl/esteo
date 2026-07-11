"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { TrackedFooterLink } from "@/features/marketing/components/tracked-footer-link";
import type { MarketingNavigationItem } from "@/features/marketing/lib/navigation";
import type { Locale } from "@/lib/locale";

export function FooterLinkList({
  items,
  locale,
  children,
}: {
  items: MarketingNavigationItem[];
  locale: Locale;
  children?: ReactNode;
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
      {children}
    </ul>
  );
}
