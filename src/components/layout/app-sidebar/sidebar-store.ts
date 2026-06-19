"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidebarSectionId = "pinned" | "team" | "admin" | "qa";

type SidebarState = {
  collapsed: boolean;
  sectionsOpen: Record<SidebarSectionId, boolean>;
  /** Estimate IDs — hydrated from server per workspace; local order until refresh. */
  pinnedOrder: string[];
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
  toggleSection: (section: SidebarSectionId) => void;
  setPinnedOrder: (order: string[]) => void;
  reorderPinned: (activeKey: string, overKey: string) => string[];
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      collapsed: false,
      sectionsOpen: {
        pinned: true,
        team: true,
        admin: true,
        qa: true,
      },
      pinnedOrder: [],
      setCollapsed: (collapsed) => set({ collapsed }),
      toggle: () => set({ collapsed: !get().collapsed }),
      toggleSection: (section) =>
        set((state) => ({
          sectionsOpen: {
            ...state.sectionsOpen,
            [section]: !state.sectionsOpen[section],
          },
        })),
      setPinnedOrder: (order) => set({ pinnedOrder: order }),
      reorderPinned: (activeKey, overKey) => {
        if (activeKey === overKey) return get().pinnedOrder;
        const order = [...get().pinnedOrder];
        const from = order.indexOf(activeKey);
        const to = order.indexOf(overKey);
        if (from === -1 || to === -1) return order;
        order.splice(from, 1);
        order.splice(to, 0, activeKey);
        set({ pinnedOrder: order });
        return order;
      },
    }),
    {
      name: "esteo.sidebar",
      partialize: (state) => ({
        collapsed: state.collapsed,
        sectionsOpen: state.sectionsOpen,
        pinnedOrder: state.pinnedOrder,
      }),
    },
  ),
);
