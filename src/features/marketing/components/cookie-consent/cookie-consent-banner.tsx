"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { getCookieConsentContent } from "@/features/marketing/content/cookie-consent-content";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import { useCookieConsent } from "./cookie-consent-provider";
import { CookieConsentCustomizeView } from "./cookie-consent-customize-view";
import { CookieConsentInitialView } from "./cookie-consent-initial-view";

const cardClassName = cn(
  "rounded-xl border border-border/45 bg-[#0a0f18]/95 backdrop-blur-xl",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
  "shadow-[0_0_48px_-16px_rgba(59,130,246,0.25)]",
);

const consentOverlayClassName = "z-[100]";
const consentDialogClassName = cn(
  "z-[100] max-w-md border-border/45 bg-[#0a0f18]/98 backdrop-blur-xl",
  cardClassName,
);
const consentSheetClassName =
  "z-[100] max-h-[45dvh] border-border/60 bg-[#0a0f18]/98 px-5 pb-6 backdrop-blur-xl";

function useIsDesktopViewport(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.matchMedia("(min-width: 768px)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function CookieConsentBanner({ locale }: { locale: Locale }) {
  const content = getCookieConsentContent(locale);
  const isDesktop = useIsDesktopViewport();
  const reducedMotion = useReducedMotion();
  const {
    view,
    analyticsEnabled,
    setAnalyticsEnabled,
    showCustomize,
    acceptAll,
    rejectAll,
    saveCustom,
    handleCustomizeOpenChange,
  } = useCookieConsent();

  const desktopEnter = reducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 24 };
  const desktopAnimate = { opacity: 1, y: 0 };
  const desktopTransition = reducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" as const };

  const mobileEnter = reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 };
  const mobileTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 380, damping: 32 };

  if (view === "customize") {
    const customizeContent = (
      <CookieConsentCustomizeView
        content={content}
        analyticsEnabled={analyticsEnabled}
        onAnalyticsChange={setAnalyticsEnabled}
        onAcceptAll={acceptAll}
        onSave={saveCustom}
        showDragHandle={!isDesktop}
      />
    );

    if (isDesktop) {
      return (
        <Dialog open onOpenChange={handleCustomizeOpenChange}>
          <DialogContent
            showCloseButton
            overlayClassName={consentOverlayClassName}
            className={consentDialogClassName}
          >
            <DialogTitle className="sr-only">{content.customizeTitle}</DialogTitle>
            <DialogDescription className="sr-only">{content.customizeSubtitle}</DialogDescription>
            {customizeContent}
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Sheet open onOpenChange={handleCustomizeOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton
          overlayClassName={consentOverlayClassName}
          className={consentSheetClassName}
        >
          <SheetTitle className="sr-only">{content.customizeTitle}</SheetTitle>
          <SheetDescription className="sr-only">{content.customizeSubtitle}</SheetDescription>
          {customizeContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:px-8 md:pb-8">
      <motion.div
        initial={desktopEnter}
        animate={desktopAnimate}
        transition={desktopTransition}
        className={cn(
          "pointer-events-auto mx-auto hidden w-full max-w-7xl px-8 py-5 md:block md:px-12 md:py-6",
          cardClassName,
        )}
      >
        <CookieConsentInitialView
          locale={locale}
          content={content}
          onAcceptAll={acceptAll}
          onCustomize={showCustomize}
          onReject={rejectAll}
          customizeExpanded={false}
        />
      </motion.div>

      <motion.div
        initial={mobileEnter}
        animate={desktopAnimate}
        transition={mobileTransition}
        className={cn("pointer-events-auto mx-auto block max-w-lg px-5 py-5 md:hidden", cardClassName)}
      >
        <CookieConsentInitialView
          locale={locale}
          content={content}
          onAcceptAll={acceptAll}
          onCustomize={showCustomize}
          onReject={rejectAll}
          customizeExpanded={false}
        />
      </motion.div>
    </div>
  );
}
