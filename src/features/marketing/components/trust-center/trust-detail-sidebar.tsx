"use client";

import { useState } from "react";

import type { TrustDetailTab } from "@/features/marketing/components/trust-center/trust-types";
import { cn } from "@/lib/utils";

export function TrustDetailSidebar({
  title,
  tabs,
  defaultTabId,
}: {
  title: string;
  tabs: TrustDetailTab[];
  defaultTabId?: string;
}) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId ?? tabs[0]?.id ?? "");
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  if (!activeTab) {
    return null;
  }

  return (
    <section className="space-y-8">
      <h2 className="text-center text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,14.5rem)_1fr] lg:gap-10">
        <nav aria-label={title} className="flex flex-col">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "w-full border-l-2 py-3.5 pl-4 pr-2 text-left text-sm leading-snug transition",
                  isActive
                    ? "border-l-primary bg-primary/[0.08] font-medium text-foreground"
                    : "border-l-transparent text-muted-foreground hover:bg-card/20 hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div
          className={cn(
            "min-w-0 rounded-xl border border-border/50 bg-card/45 p-6 sm:p-8",
            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
          )}
        >
          {activeTab.panel}
        </div>
      </div>
    </section>
  );
}
