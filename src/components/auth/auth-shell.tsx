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

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [logoOk, setLogoOk] = useState(true);
  const t = useTranslations("auth");

  return (
    <div className="min-h-screen bg-muted/25 p-3 sm:p-4 sm:p-6 dark:bg-background">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1040px] items-start justify-center lg:min-h-[calc(100vh-3rem)] lg:items-center lg:py-0">
        <div className="w-full overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm lg:max-w-[860px]">
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

                  <CardFooter className="flex flex-col gap-4 px-0 pt-6">
                    <p className="pb-1 text-center text-xs text-muted-foreground">
                      {t("termsNotice")}
                    </p>

                    <ThemeToggle />
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