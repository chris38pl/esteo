export const TRUST_PROVIDER_LOGO_SRC: Record<string, string> = {
  clerk: "/images/trust/providers/clerk.svg",
  stripe: "/images/trust/providers/stripe.svg",
  neon: "/images/trust/providers/neon.svg",
  vercel: "/images/trust/providers/vercel.svg",
  uploadthing: "/images/trust/providers/uploadthing.svg",
  openai: "/images/trust/providers/openai.svg",
};

export const TRUST_PROVIDER_HREF: Record<string, string> = {
  clerk: "https://clerk.com",
  stripe: "https://stripe.com",
  neon: "https://neon.tech",
  vercel: "https://vercel.com",
  uploadthing: "https://uploadthing.com",
  openai: "https://openai.com",
};

export function getTrustProviderLogoSrc(providerId: string): string | null {
  return TRUST_PROVIDER_LOGO_SRC[providerId] ?? null;
}

export function getTrustProviderHref(providerId: string): string | null {
  return TRUST_PROVIDER_HREF[providerId] ?? null;
}
