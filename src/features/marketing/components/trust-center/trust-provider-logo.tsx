import Image from "next/image";

import { getTrustProviderLogoSrc } from "@/features/marketing/components/trust-center/provider-logo-src";
import { cn } from "@/lib/utils";

export function TrustProviderLogo({
  providerId,
  providerName,
  className,
}: {
  providerId: string;
  providerName: string;
  className?: string;
}) {
  const src = getTrustProviderLogoSrc(providerId);

  if (!src) {
    return null;
  }

  return (
    <span
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl border border-border/40 bg-card/60 p-2",
        className,
      )}
    >
      <Image
        src={src}
        alt=""
        aria-hidden
        width={28}
        height={28}
        className="size-7 object-contain"
      />
      <span className="sr-only">{providerName}</span>
    </span>
  );
}
