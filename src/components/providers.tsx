"use client";

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
      {children}
      <Toaster richColors closeButton position="top-center" />
    </ThemeProvider>
  );
}
