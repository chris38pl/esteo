"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_PINNED_ORDER } from "./pinned-config";

export type SidebarSectionId = "pinned" | "team";

type SidebarState = {
  collapsed: boolean;
  sectionsOpen: Record<SidebarSectionId, boolean>;
  pinnedOrder: string[];
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
  toggleSection: (section: SidebarSectionId) => void;
  setPinnedOrder: (order: string[]) => void;
  reorderPinned: (activeKey: string, overKey: string) => void;
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      collapsed: false,
      sectionsOpen: {
        pinned: true,
        team: true,
      },
      pinnedOrder: DEFAULT_PINNED_ORDER,
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
        if (activeKey === overKey) return;
        const order = [...get().pinnedOrder];
        const from = order.indexOf(activeKey);
        const to = order.indexOf(overKey);
        if (from === -1 || to === -1) return;
        order.splice(from, 1);
        order.splice(to, 0, activeKey);
        set({ pinnedOrder: order });
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
