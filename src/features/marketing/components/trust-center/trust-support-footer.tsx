import { MessageCircle } from "lucide-react";

import { siteConfig } from "@/features/marketing/seo/site-config";
import { cn } from "@/lib/utils";

type TrustSupportFooterProps = {
  heading: string;
  subtext: string;
  ctaLabel: string;
  email?: string;
};

export function TrustSupportFooter({
  heading,
  subtext,
  ctaLabel,
  email = siteConfig.supportEmail,
}: TrustSupportFooterProps) {
  return (
    <footer
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border/35 bg-card/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5",
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            "bg-[radial-gradient(circle_at_50%_32%,rgba(59,130,246,0.28),rgba(30,64,175,0.1)_58%,rgba(15,23,42,0.24)_100%)]",
          )}
        >
          <MessageCircle className="size-5 text-sky-400" strokeWidth={1.5} aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground sm:text-[0.9375rem]">{heading}</p>
          <p className="text-sm leading-6 text-muted-foreground">{subtext}</p>
        </div>
      </div>

      <a
        href={`mailto:${email}`}
        className={cn(
          "inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition",
          "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "sm:ml-auto",
        )}
      >
        {ctaLabel}
      </a>
    </footer>
  );
}
