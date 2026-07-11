import Link from "next/link";

import { siteConfig } from "@/features/marketing/seo/site-config";

type TrustSupportFooterProps = {
  heading: string;
  email: string;
  linkLabel: string;
};

export function TrustSupportFooter({ heading, email, linkLabel }: TrustSupportFooterProps) {
  return (
    <footer className="mt-16 border-t border-border/60 pt-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{heading}</p>
        <a
          href={`mailto:${email}`}
          className="block text-sm text-muted-foreground transition hover:text-foreground"
        >
          {email}
        </a>
        <Link
          href={`mailto:${siteConfig.supportEmail}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          {linkLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </footer>
  );
}
