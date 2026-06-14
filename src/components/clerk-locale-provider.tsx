"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark, experimental__simple } from "@clerk/themes";
import { useTheme } from "@teispace/next-themes";
import type { ReactNode } from "react";

import { getClerkLocalization } from "@/lib/clerk-localization";
import type { Locale } from "@/lib/locale";

export function ClerkLocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <ClerkProvider
      localization={getClerkLocalization(locale)}
      appearance={{
        baseTheme: isDark ? dark : experimental__simple,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
