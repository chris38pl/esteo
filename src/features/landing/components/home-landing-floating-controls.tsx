"use client";

import { Suspense } from "react";

import { AuthLocaleToggle } from "@/components/auth/auth-locale-toggle";
import type { Locale } from "@/lib/locale";

const floatingLocaleClass =
  "border-border/60 bg-card/50 opacity-50 shadow-none backdrop-blur-sm hover:opacity-80";

function HomeLandingFloatingControlsInner({ locale }: { locale: Locale }) {
  return (
    <div className="fixed bottom-4 left-4 z-40 hidden lg:block">
      <AuthLocaleToggle
        locale={locale}
        className={floatingLocaleClass}
        dropdownSide="top"
      />
    </div>
  );
}

export function HomeLandingFloatingControls({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={null}>
      <HomeLandingFloatingControlsInner locale={locale} />
    </Suspense>
  );
}
