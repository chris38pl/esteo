import type { Metadata } from "next";

import type { Locale } from "@/lib/locale";
import { buildCanonicalUrl } from "@/features/marketing/lib/build-canonical";
import { buildLocaleAlternates } from "@/features/marketing/lib/locale-links";
import { siteConfig } from "@/features/marketing/seo/site-config";

type BuildMarketingMetadataInput = {
  locale: Locale;
  path?: string;
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
};

const openGraphLocale: Record<Locale, string> = {
  pl: "pl_PL",
  en: "en_US",
};

export function buildMarketingMetadata({
  locale,
  path = "/",
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
}: BuildMarketingMetadataInput): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const canonical = buildCanonicalUrl(locale, path);
  const imageUrl = image.startsWith("http") ? image : `${siteConfig.url}${image}`;

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical,
      languages: buildLocaleAlternates(path),
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: pageTitle,
      description,
      url: canonical,
      locale: openGraphLocale[locale],
      alternateLocale: siteConfig.locales
        .filter((alternateLocale) => alternateLocale !== locale)
        .map((alternateLocale) => openGraphLocale[alternateLocale]),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}
