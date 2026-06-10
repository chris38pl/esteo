"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark, experimental__simple } from "@clerk/themes";
import { useTheme } from "@teispace/next-themes";
import type { ReactNode } from "react";

import { NavigationProgress } from "@/components/navigation-progress";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <NavigationProgress />
      <ClerkThemeBridge>{children}</ClerkThemeBridge>
      <Toaster richColors closeButton position="top-center" />
    </ThemeProvider>
  );
}

function ClerkThemeBridge({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <ClerkProvider
      appearance={{
        baseTheme: isDark ? dark : experimental__simple,
      }}
    >
      {children}
    </ClerkProvider>
  );
}

