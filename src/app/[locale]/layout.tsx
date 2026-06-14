import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import { ClerkLocaleProvider } from "@/components/clerk-locale-provider";
import { DocumentLang } from "@/components/document-lang";
import { isLocale, type Locale } from "@/lib/locale";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;

  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <ClerkLocaleProvider locale={locale}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <DocumentLang locale={locale} />
        <div data-locale={locale} className="flex min-h-full flex-col">
          {children}
        </div>
      </NextIntlClientProvider>
    </ClerkLocaleProvider>
  );
}

