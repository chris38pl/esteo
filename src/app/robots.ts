import type { MetadataRoute } from "next";

import { siteConfig } from "@/features/marketing/seo/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/pl/dashboard/",
        "/en/dashboard/",
        "/pl/styleguide/",
        "/en/styleguide/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
