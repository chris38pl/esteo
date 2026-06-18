// src/components/auth/auth-shell.tsx
"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthLocaleToggle } from "@/components/auth/auth-locale-toggle";
import type { Locale } from "@/lib/locale";

const authThemeToggleOnImageClass =
  "size-9 rounded-lg border-white/35 bg-white/45 p-0 opacity-65 shadow-none backdrop-blur-sm hover:opacity-90 dark:border-white/20 dark:bg-black/25";

const authThemeToggleOnMobileClass =
  "size-9 rounded-lg border-border/60 bg-card/50 p-0 opacity-65 shadow-none backdrop-blur-sm hover:opacity-90";

const authLocaleToggleOnImageClass =
  "border-white/35 bg-white/45 dark:border-white/20 dark:bg-black/25";

const authLocaleToggleOnMobileClass = "border-border/60 bg-card/50";

export function AuthShell({
  locale,
  title,
  subtitle,
  children,
}: {
  locale: Locale;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [logoOk, setLogoOk] = useState(true);
  const t = useTranslations("auth");

  return (
    <div className="min-h-screen bg-muted/25 p-3 sm:p-4 sm:p-6 dark:bg-background">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1040px] items-start justify-center lg:min-h-[calc(100vh-3rem)] lg:items-center lg:py-0">
        <div className="relative w-full overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm lg:max-w-[860px]">
          <div className="absolute left-4 top-4 z-10 lg:hidden">
            <AuthLocaleToggle locale={locale} className={authLocaleToggleOnMobileClass} />
          </div>
          <div className="absolute right-4 top-4 z-10 lg:hidden">
            <ThemeToggle compact className={authThemeToggleOnMobileClass} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
            <div className="relative hidden lg:block">
              <Image
                src="/auth/auth-light.png"
                alt=""
                fill
                priority
                sizes="360px"
                className="object-cover object-center dark:hidden"
              />
              <Image
                src="/auth/auth-dark.png"
                alt=""
                fill
                priority
                sizes="360px"
                className="hidden object-cover object-center dark:block"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-background/25 via-transparent to-transparent" />

              <div className="absolute left-4 top-4 z-10">
                <ThemeToggle compact className={authThemeToggleOnImageClass} />
              </div>

              <div className="absolute bottom-4 left-4 z-10">
                <AuthLocaleToggle locale={locale} className={authLocaleToggleOnImageClass} />
              </div>
            </div>

            <div className="flex items-center justify-center px-5 py-6 sm:px-8 lg:px-10">
              <div className="w-full max-w-[340px]">
                <Card className="border-0 bg-transparent shadow-none">
                  <CardHeader className="space-y-1 px-0 pb-6 pt-0">
                    <div className="flex flex-col items-center justify-center gap-2 pb-1">
                      {logoOk ? (
                        <Image
                          src="/logo.png"
                          alt={t("brandName")}
                          width={150}
                          height={150}
                          className="rounded-full"
                          onError={() => setLogoOk(false)}
                          style={{ height: "auto" }}
                        />
                      ) : (
                        <div className="size-[72px] rounded-full border border-border/60 bg-muted" />
                      )}
                    </div>

                    <h1 className="text-center text-2xl font-semibold tracking-tight">
                      {title}
                    </h1>

                    <p className="text-center text-sm text-muted-foreground">
                      {subtitle}
                    </p>
                  </CardHeader>

                  <CardContent className="px-0 [&_.cl-rootBox]:w-full">
                    {children}
                  </CardContent>

                  <CardFooter className="px-0 pt-6">
                    <p className="pb-1 text-center text-xs text-muted-foreground">
                      {t("termsNotice")}
                    </p>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}