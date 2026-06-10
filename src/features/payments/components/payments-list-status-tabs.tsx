"use client";

import { Ellipsis } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  estimateEditorTabsDesktopClass,
  estimateEditorTabsMobileClass,
} from "@/features/estimates/lib/estimate-layout-config";
import type { PaymentListStatusTab } from "@/features/payments/lib/payment-list-filter";
import { cn } from "@/lib/utils";

const TAB_IDS: PaymentListStatusTab[] = ["ALL", "PAID", "PARTIAL", "PENDING", "OVERDUE"];

const MOBILE_PINNED_TAB_IDS = ["ALL", "PAID"] as const;
const MOBILE_DEFAULT_THIRD_TAB: PaymentListStatusTab = "PARTIAL";
const MOBILE_OVERFLOW_TAB_IDS: PaymentListStatusTab[] = ["PENDING", "OVERDUE"];

function getMobileVisibleTabIds(activeTab: PaymentListStatusTab): PaymentListStatusTab[] {
  const third = MOBILE_OVERFLOW_TAB_IDS.includes(activeTab)
    ? activeTab
    : MOBILE_DEFAULT_THIRD_TAB;

  return [...MOBILE_PINNED_TAB_IDS, third];
}

function getMobileOverflowMenuTabIds(activeTab: PaymentListStatusTab): PaymentListStatusTab[] {
  if (MOBILE_OVERFLOW_TAB_IDS.includes(activeTab)) {
    return [
      MOBILE_DEFAULT_THIRD_TAB,
      ...MOBILE_OVERFLOW_TAB_IDS.filter((id) => id !== activeTab),
    ];
  }

  return MOBILE_OVERFLOW_TAB_IDS;
}

interface PaymentsListStatusTabsProps {
  activeTab: PaymentListStatusTab;
  onTabChange: (tab: PaymentListStatusTab) => void;
  counts: Record<PaymentListStatusTab, number>;
}

function TabCountBadge({ count, active }: { count: number; active: boolean }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {count}
    </span>
  );
}

function TabButton({
  tab,
  isActive,
  label,
  count,
  onSelect,
  compact = false,
}: {
  tab: PaymentListStatusTab;
  isActive: boolean;
  label: string;
  count: number;
  onSelect: (tab: PaymentListStatusTab) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => onSelect(tab)}
      className={cn(
        "relative min-w-0 transition-colors",
        compact ? "flex-1 px-2 py-3 text-xs font-medium" : "shrink-0 px-4 py-3 text-sm font-medium",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="inline-flex min-w-0 items-center justify-center gap-1.5">
        <span className="truncate">{label}</span>
        <TabCountBadge count={count} active={isActive} />
      </span>
      {isActive ? (
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden />
      ) : null}
    </button>
  );
}

export function PaymentsListStatusTabs({
  activeTab,
  onTabChange,
  counts,
}: PaymentsListStatusTabsProps) {
  const t = useTranslations("payments");
  const mobileVisibleTabIds = getMobileVisibleTabIds(activeTab);
  const mobileOverflowMenuTabIds = getMobileOverflowMenuTabIds(activeTab);

  const tabLabel = (tab: PaymentListStatusTab) => t(`list.statusTabs.${tab}`);

  return (
    <div className="border-b border-border/60">
      <div className={estimateEditorTabsDesktopClass}>
        <div
          className="flex min-w-0 flex-1 gap-0 px-2"
          role="tablist"
          aria-label={t("list.statusTabs.label")}
        >
          {TAB_IDS.map((tab) => (
            <TabButton
              key={tab}
              tab={tab}
              isActive={activeTab === tab}
              label={tabLabel(tab)}
              count={counts[tab]}
              onSelect={onTabChange}
            />
          ))}
        </div>
      </div>

      <div
        className={cn(estimateEditorTabsMobileClass, "min-w-0 flex-1 items-stretch px-1")}
        role="tablist"
        aria-label={t("list.statusTabs.label")}
      >
        {mobileVisibleTabIds.map((tab) => (
          <TabButton
            key={tab}
            tab={tab}
            isActive={activeTab === tab}
            label={tabLabel(tab)}
            count={counts[tab]}
            onSelect={onTabChange}
            compact
          />
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="relative flex shrink-0 items-center justify-center px-3 py-3 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t("list.statusTabs.more")}
            >
              <Ellipsis className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            {mobileOverflowMenuTabIds.map((tab) => (
              <DropdownMenuItem
                key={tab}
                onClick={() => onTabChange(tab)}
                className={cn(
                  "gap-2",
                  activeTab === tab && "font-medium text-primary",
                )}
              >
                <span>{tabLabel(tab)}</span>
                <TabCountBadge count={counts[tab]} active={activeTab === tab} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
