"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AvatarPreset } from "@/components/avatars/user-avatar";
import { updateUserAvatarPresetAction } from "@/features/users/server/actions";
import { AVATAR_PRESETS } from "@/lib/avatars/user-avatar-presets";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function presetSrc(preset: AvatarPreset) {
  return `/avatars/${preset}.png`;
}

export function AvatarPresetPicker({
  locale,
  selectedPreset,
}: {
  locale: Locale;
  selectedPreset: AvatarPreset | null;
}) {
  const router = useRouter();
  const [activePreset, setActivePreset] = useState<AvatarPreset | null>(selectedPreset);
  const [isPending, startTransition] = useTransition();

  function selectPreset(preset: AvatarPreset) {
    if (preset === activePreset || isPending) {
      return;
    }

    setActivePreset(preset);

    startTransition(async () => {
      const result = await updateUserAvatarPresetAction(preset, locale);

      if (!result.success) {
        setActivePreset(selectedPreset);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {AVATAR_PRESETS.map((preset) => {
        const isSelected = activePreset === preset;

        return (
          <button
            key={preset}
            type="button"
            disabled={isPending}
            aria-pressed={isSelected}
            onClick={() => selectPreset(preset)}
            className={cn(
              "relative size-12 shrink-0 overflow-hidden rounded-full transition",
              "ring-2 ring-offset-2 ring-offset-card",
              isSelected ? "ring-primary" : "ring-transparent hover:ring-border/80",
              isPending && "opacity-70",
            )}
          >
            <Image
              src={presetSrc(preset)}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
            {isSelected ? (
              <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
                <Check className="size-3" strokeWidth={2.5} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
