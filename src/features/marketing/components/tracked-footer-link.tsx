"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { trackMarketingEvent } from "@/features/marketing/lib/track-marketing-event";
import type { Locale } from "@/lib/locale";

export function TrackedFooterLink({
  href,
  locale,
  page,
  target,
  children,
}: {
  href: string;
  locale: Locale;
  page: string;
  target: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="transition hover:text-foreground"
      onClick={() =>
        trackMarketingEvent("footer_link_clicked", {
          locale,
          page,
          target,
        })
      }
    >
      {children}
    </Link>
  );
}
