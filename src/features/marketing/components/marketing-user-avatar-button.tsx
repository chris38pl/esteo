"use client";

import { UserButton } from "@clerk/nextjs";

import { cn } from "@/lib/utils";

export function MarketingUserAvatarButton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center rounded-full border border-border/60 bg-card/50 p-0.5",
        className,
      )}
    >
      <UserButton
        appearance={{
          elements: {
            avatarBox: "size-8 sm:size-9",
          },
        }}
      />
    </div>
  );
}
