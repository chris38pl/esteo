import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const LOCALES = ["pl", "en"];

/**
 * Old cookie-era paths that no longer exist as static routes.
 * Each entry redirects to /dashboard so the runtime slug resolver can
 * land the user on the right workspace-scoped URL.
 *
 * These rules can be removed once all bookmarks / external links have expired.
 */
const legacyDashboardRedirects = LOCALES.flatMap((locale) => [
  {
    source: `/${locale}/dashboard/workspaces/settings`,
    destination: `/${locale}/dashboard`,
    permanent: true,
  },
  {
    source: `/${locale}/dashboard/:workspaceSlug/account`,
    destination: `/${locale}/dashboard/account`,
    permanent: true,
  },
  {
    source: `/${locale}/dashboard/:workspaceSlug/billing`,
    destination: `/${locale}/dashboard/billing`,
    permanent: true,
  },
]);

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    middlewareClientMaxBodySize: "12mb",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      ...legacyDashboardRedirects,
      {
        source: "/en/wycena/:workspaceSlug",
        destination: "/en/estimate-request/:workspaceSlug",
        permanent: true,
      },
      {
        source: "/pl/estimate-request/:workspaceSlug",
        destination: "/pl/wycena/:workspaceSlug",
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
