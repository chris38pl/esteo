import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isLocale } from "@/lib/locale";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <div data-locale={locale} className="flex min-h-full flex-col">
      {children}
    </div>
  );
}

