import type { User } from "@prisma/client";

import { getCurrentUser } from "@/server/auth/get-current-user";
import { defaultLocale, isLocale, type Locale } from "@/lib/locale";

export type TRPCContext = {
  /** Resolved application user, or `null` for unauthenticated requests. */
  user: User | null;
  /** Locale for server-side translations, taken from the `x-locale` header. */
  locale: Locale;
  headers: Headers;
};

/**
 * Builds the per-request tRPC context.
 *
 * Auth is resolved via Clerk (cookie for web, `Authorization: Bearer` for
 * external clients) through `getCurrentUser`. Locale comes from an explicit
 * `x-locale` header set by the client; there is no cookie/`Accept-Language`
 * guessing here because API clients are expected to be explicit.
 */
export async function createTRPCContext(opts: {
  headers: Headers;
}): Promise<TRPCContext> {
  const user = await getCurrentUser();

  const headerLocale = opts.headers.get("x-locale");
  const locale: Locale =
    headerLocale && isLocale(headerLocale) ? headerLocale : defaultLocale;

  return {
    user: user ?? null,
    locale,
    headers: opts.headers,
  };
}
