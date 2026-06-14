"use client";

import type { IssueContext } from "@/features/issues/lib/issue-context";
import { resolveDeviceType } from "@/features/issues/lib/resolve-device-type";
import type { Locale } from "@/lib/locale";

export function collectIssueMetadata(input: {
  locale: Locale;
  workspaceSlug: string | null;
}): {
  pageUrl: string;
  context: IssueContext | null;
  locale: Locale;
  userAgent: string;
  deviceType: ReturnType<typeof resolveDeviceType>;
  viewportWidth: number;
  viewportHeight: number;
} {
  const context: IssueContext | null = input.workspaceSlug
    ? { workspaceSlug: input.workspaceSlug }
    : null;

  return {
    pageUrl: `${window.location.pathname}${window.location.search}`,
    context,
    locale: input.locale,
    userAgent: navigator.userAgent,
    deviceType: resolveDeviceType(window.innerWidth),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}
