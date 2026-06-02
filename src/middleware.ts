//src\middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { defaultLocale, locales } from "@/lib/locale";

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

const isPublicRoute = createRouteMatcher([
  "/",
  "/:locale",
  "/:locale/sign-in(.*)",
  "/:locale/sign-up(.*)",
  "/:locale/styleguide(.*)",
  "/:locale/wycena(.*)",
  "/api/health",
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

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  const intlResponse = intlMiddleware(request);

  // If intlMiddleware issues a redirect (e.g. / → /pl/), honour it without modification.
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
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

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

