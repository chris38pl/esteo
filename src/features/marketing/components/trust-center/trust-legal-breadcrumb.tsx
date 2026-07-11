import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";

type TrustLegalBreadcrumbProps = {
  locale: Locale;
  hubLabel: string;
  currentLabel: string;
};

export function TrustLegalBreadcrumb({ locale, hubLabel, currentLabel }: TrustLegalBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link
            href={buildLocalizedPath(locale, "/legal")}
            className="transition hover:text-foreground"
          >
            {hubLabel}
          </Link>
        </li>
        <li aria-hidden className="flex items-center">
          <ChevronRight className="size-3.5" />
        </li>
        <li>
          <span className="text-foreground">{currentLabel}</span>
        </li>
      </ol>
    </nav>
  );
}
