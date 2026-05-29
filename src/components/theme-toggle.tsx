"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@teispace/next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const buttonClass = className
    ? className
    : compact
      ? "size-9 rounded-lg border-border/60 bg-card/40 p-0 shadow-none"
      : "size-11 rounded-full border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40";

  const iconClass = compact ? "size-3.5" : "size-5";

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Toggle theme" // i18n-ignore-line
        className={`${buttonClass} cursor-pointer`}
        disabled
      >
        <Sun className={`${iconClass} opacity-60`} />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`${buttonClass} cursor-pointer`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Moon className={iconClass} /> : <Sun className={iconClass} />}
    </Button>
  );
}

