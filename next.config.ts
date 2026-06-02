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
    source: `/${locale}/dashboard/billing`,
    destination: `/${locale}/dashboard`,
    permanent: true,
  },
  {
    source: `/${locale}/dashboard/account`,
    destination: `/${locale}/dashboard`,
    permanent: true,
  },
  {
    source: `/${locale}/dashboard/workspaces/settings`,
    destination: `/${locale}/dashboard`,
    permanent: true,
  },
]);

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return legacyDashboardRedirects;
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
