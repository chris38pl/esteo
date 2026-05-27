"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@teispace/next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Toggle theme"
        className="size-11 rounded-full border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 cursor-pointer"
        disabled
      >
        <Sun className="size-5 opacity-60" />
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
      className="size-11 rounded-full border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40 cursor-pointer"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
    </Button>
  );
}

