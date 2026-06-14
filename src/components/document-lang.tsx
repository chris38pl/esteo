"use client";

import { useEffect } from "react";

import type { Locale } from "@/lib/locale";

export function DocumentLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
