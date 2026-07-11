"use client";

import { Button } from "@/components/ui/button";
import type { CookieConsentContent } from "@/features/marketing/content/cookie-consent-content";

import {
  CookieConsentCategoryRows,
  CookieConsentIcon,
} from "./cookie-consent-category-rows";

type CookieConsentCustomizeViewProps = {
  content: CookieConsentContent;
  analyticsEnabled: boolean;
  onAnalyticsChange: (value: boolean) => void;
  onAcceptAll: () => void;
  onSave: () => void;
  showDragHandle?: boolean;
};

export function CookieConsentCustomizeView({
  content,
  analyticsEnabled,
  onAnalyticsChange,
  onAcceptAll,
  onSave,
  showDragHandle = false,
}: CookieConsentCustomizeViewProps) {
  return (
    <div className="space-y-5">
      {showDragHandle ? (
        <div className="flex justify-center pt-1" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <CookieConsentIcon />
        <div className="space-y-1">
          <p className="text-base font-semibold tracking-tight text-foreground">{content.customizeTitle}</p>
          <p className="text-sm leading-6 text-muted-foreground">{content.customizeSubtitle}</p>
        </div>
      </div>

      <CookieConsentCategoryRows
        content={content}
        analyticsEnabled={analyticsEnabled}
        onAnalyticsChange={onAnalyticsChange}
      />

      <div className="flex flex-col gap-2">
        <Button type="button" size="lg" className="w-full" onClick={onAcceptAll}>
          {content.ctaAcceptAll}
        </Button>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={onSave}>
          {content.ctaSave}
        </Button>
      </div>
    </div>
  );
}
