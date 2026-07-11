"use client";

import type { ComponentProps } from "react";

import { MarketingCTA } from "@/features/marketing/components/cta";
import {
  trackMarketingEvent,
  type MarketingEventName,
  type MarketingEventProperties,
} from "@/features/marketing/lib/track-marketing-event";

type TrackedMarketingCTAProps = Omit<ComponentProps<typeof MarketingCTA>, "onClick"> & {
  event: MarketingEventName;
  eventProperties?: MarketingEventProperties;
};

export function TrackedMarketingCTA({
  event,
  eventProperties,
  onClick,
  ...props
}: TrackedMarketingCTAProps & { onClick?: ComponentProps<typeof MarketingCTA>["onClick"] }) {
  return (
    <MarketingCTA
      {...props}
      onClick={(clickEvent) => {
        trackMarketingEvent(event, eventProperties);
        onClick?.(clickEvent);
      }}
    />
  );
}
