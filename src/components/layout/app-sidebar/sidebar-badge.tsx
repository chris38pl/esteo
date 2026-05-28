import { cn } from "@/lib/utils";

export function SidebarSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "sidebar-soon-badge shrink-0 rounded-md px-1.5 py-px text-[9px] font-medium leading-none",
        className,
      )}
    >
      Soon
    </span>
  );
}
