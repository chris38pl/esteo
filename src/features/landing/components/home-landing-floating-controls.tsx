"use client";

import { Suspense } from "react";

import { AuthLocaleToggle } from "@/components/auth/auth-locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/lib/locale";

const floatingThemeClass =
  "size-9 rounded-lg border-border/60 bg-card/50 p-0 opacity-50 shadow-none backdrop-blur-sm hover:opacity-80";

const floatingLocaleClass =
  "border-border/60 bg-card/50 opacity-50 shadow-none backdrop-blur-sm hover:opacity-80";

function HomeLandingFloatingControlsInner({ locale }: { locale: Locale }) {
  return (
    <>
      <div className="fixed left-4 top-4 z-40 hidden lg:block">
        <ThemeToggle compact className={floatingThemeClass} />
      </div>

      <div className="fixed bottom-4 left-4 z-40 hidden lg:block">
        <AuthLocaleToggle
          locale={locale}
          className={floatingLocaleClass}
          dropdownSide="top"
        />
      </div>

      <div className="fixed right-4 top-4 z-40 flex items-center gap-2 lg:hidden">
        <ThemeToggle compact className={floatingThemeClass} />
        <AuthLocaleToggle locale={locale} className={floatingLocaleClass} />
      </div>
    </>
  );
}

export function HomeLandingFloatingControls({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={null}>
      <HomeLandingFloatingControlsInner locale={locale} />
    </Suspense>
  );
}
