//src\middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { defaultLocale, LOCALE_COOKIE_NAME, locales } from "@/lib/locale";
import { applyReferralAttributionCookie } from "@/features/referrals/lib/apply-referral-attribution-cookie";

const isPublicRoute = createRouteMatcher([
  "/",
  "/:locale",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
  "/:locale/r/:code",
  "/:locale/styleguide(.*)",
  "/:locale/pricing",
  "/:locale/faq",
  "/:locale/contact",
  "/:locale/security",
  "/:locale/legal(.*)",
  "/:locale/wycena(.*)",
  "/:locale/estimate-request(.*)",
  "/api/health",
  "/api/public/voice-intake",
  "/api/public/estimate-requests",
  "/api/public/request-attachments/upload",
  "/api/public/request-attachments/(.*)",
  // Stripe webhooks authenticate via signature, not Clerk session.
  "/api/webhooks/stripe",
]);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // API routes are not locale-prefixed; skip next-intl to avoid /pl/api/* redirects.
  if (pathname.startsWith("/api")) {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
    return;
  }

  // Use redirectToSignIn for pages — auth.protect() can return 404 for RSC flight
  // requests during client navigations to /dashboard/[workspaceSlug] (Next.js 16).
  if (!isPublicRoute(request)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: request.url });
    }
  }

  const intlMiddleware = createIntlMiddleware({
    locales: [...locales],
    defaultLocale,
    localePrefix: "always",
    localeDetection: request.cookies.has(LOCALE_COOKIE_NAME),
  });

  const intlResponse = intlMiddleware(request);

  // If intlMiddleware issues a redirect (e.g. / → /pl/), honour it without modification.
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    applyReferralAttributionCookie(request, intlResponse);
    return intlResponse;
  }

  // For non-redirect responses, inject the current pathname into the request headers
  // so that Server Components (layouts) can read it via headers('x-pathname').
  // This allows the outer (dashboard) layout to extract the workspace slug from the URL
  // without Next.js passing it as a dynamic param.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Forward any cookies the intlMiddleware set (e.g. the locale preference cookie).
  intlResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    response.cookies.set(name, value, options);
  });

  applyReferralAttributionCookie(request, response);

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

