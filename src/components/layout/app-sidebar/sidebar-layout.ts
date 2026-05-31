import { cn } from "@/lib/utils";

/** Shared horizontal inset for sidebar sections (matches reference ~12–14px). */
export const SIDEBAR_INSET = "px-3";

/** Inner row padding used by nav links and aligned sidebar rows. */
export const SIDEBAR_ITEM_INSET_X = "px-2.5";

export const SIDEBAR_INSET_COLLAPSED = "px-1.5";

export function sidebarInsetClass(collapsed: boolean, inDrawer = false) {
  return cn(
    collapsed ? SIDEBAR_INSET_COLLAPSED : SIDEBAR_INSET,
    inDrawer && "w-full min-w-0 max-w-full",
  );
}
