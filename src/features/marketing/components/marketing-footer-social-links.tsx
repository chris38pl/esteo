import { Mail } from "lucide-react";
import { FaLinkedinIn, FaYoutube } from "react-icons/fa6";
import type { IconType } from "react-icons";

import { siteConfig } from "@/features/marketing/seo/site-config";
import { cn } from "@/lib/utils";

const socialIconClassName =
  "inline-flex size-10 items-center justify-center rounded-full bg-muted/40 text-foreground transition hover:bg-muted/60";

const brandSocialItems = [
  { key: "linkedin" as const, label: "LinkedIn", Icon: FaLinkedinIn },
  { key: "youtube" as const, label: "YouTube", Icon: FaYoutube },
] satisfies { key: keyof typeof siteConfig.socials; label: string; Icon: IconType }[];

export function MarketingFooterSocialLinks() {
  return (
    <div className="flex items-center gap-2.5">
      {brandSocialItems.map(({ key, label, Icon }) => {
        const href = siteConfig.socials[key];

        if (!href) {
          return (
            <span
              key={key}
              className={cn(socialIconClassName, "cursor-default opacity-60")}
              aria-label={label}
            >
              <Icon className="size-4" aria-hidden />
            </span>
          );
        }

        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={socialIconClassName}
            aria-label={label}
          >
            <Icon className="size-4" aria-hidden />
          </a>
        );
      })}

      <a
        href={`mailto:${siteConfig.supportEmail}`}
        className={socialIconClassName}
        aria-label={`Email: ${siteConfig.supportEmail}`}
      >
        <Mail className="size-4" aria-hidden />
      </a>
    </div>
  );
}
