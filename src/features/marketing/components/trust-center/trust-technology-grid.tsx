import type { TrustTechnologyProvider } from "@/features/marketing/components/trust-center/trust-types";
import { getTrustProviderHref } from "@/features/marketing/components/trust-center/provider-logo-src";
import { TrustProviderLogo } from "@/features/marketing/components/trust-center/trust-provider-logo";
import { cn } from "@/lib/utils";

const providerLinkClassName =
  "rounded-sm transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type TrustProviderGridProps = {
  providers: TrustTechnologyProvider[];
  disclaimer: string;
};

export function TrustProviderGrid({ providers, disclaimer }: TrustProviderGridProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const href = getTrustProviderHref(provider.id);

          return (
            <article
              key={provider.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-border/45 bg-background/20 p-3.5",
              )}
            >
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(providerLinkClassName, "shrink-0 opacity-100 transition hover:opacity-80")}
                  aria-label={provider.name}
                >
                  <TrustProviderLogo providerId={provider.id} providerName={provider.name} />
                </a>
              ) : (
                <TrustProviderLogo providerId={provider.id} providerName={provider.name} />
              )}
              <div className="min-w-0 space-y-1">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(providerLinkClassName, "text-foreground")}
                  >
                    <h4 className="text-sm font-semibold">{provider.name}</h4>
                  </a>
                ) : (
                  <h4 className="text-sm font-semibold text-foreground">{provider.name}</h4>
                )}
                <p className="text-xs leading-5 text-muted-foreground sm:text-[13px] sm:leading-6">
                  {provider.description}
                </p>
              </div>
            </article>
          );
        })}
      </div>
      <p className="text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
        {disclaimer}
      </p>
    </div>
  );
}

export function TrustTechnologyFootnote({ text }: { text: string }) {
  return (
    <p className="text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
      {text}
    </p>
  );
}
