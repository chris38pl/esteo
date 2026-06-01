"use client";

import Image from "next/image";
import { Rocket } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { FocusedDashboardUserMenu } from "@/components/layout/dashboard-top-nav/focused-dashboard-user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type WorkspaceCreateShellMode = "onboarding" | "new";
type WorkspaceCreateShellLayout = "fullscreen" | "embedded";

export function WorkspaceCreateShell({
  mode,
  layout = "fullscreen",
  children,
  headerTrailing,
}: {
  mode: WorkspaceCreateShellMode;
  layout?: WorkspaceCreateShellLayout;
  children: ReactNode;
  headerTrailing?: ReactNode;
}) {
  const t = useTranslations("workspaces.shell");
  const embedded = layout === "embedded";

  const card = (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm",
        embedded ? "w-full max-w-[920px]" : "w-full lg:max-w-[920px]",
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">
        <div className="relative hidden min-h-[520px] lg:block lg:min-h-full">
          <Image
            src="/workspace-setup/setup-light.png"
            alt=""
            fill
            priority
            sizes="360px"
            className="object-cover object-center dark:hidden"
          />
          <Image
            src="/workspace-setup/setup-dark.png"
            alt=""
            fill
            priority
            sizes="360px"
            className="hidden object-cover object-center dark:block"
          />

          <div className="absolute inset-x-0 top-1/3 -translate-y-1/2 p-8">
            <div className="mb-4 inline-flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
              <Rocket className="size-5" strokeWidth={1.75} />
            </div>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
              {t("heroTitle")}{" "}
              <span className="text-primary">{t("heroTitleAccent")}</span>
            </h2>
            <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
              {t("heroSubtitle")}
            </p>
          </div>

          {!embedded ? (
            <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center">
              <ThemeToggle
                compact
                className="size-9 rounded-lg border-white/35 bg-white/45 p-0 opacity-65 shadow-none backdrop-blur-sm hover:opacity-85 dark:border-white/20 dark:bg-black/25"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="mb-8 space-y-1">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight">
                {t(`${mode}.title`)}
              </h1>
              {headerTrailing ? (
                <div className="shrink-0">{headerTrailing}</div>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{t(`${mode}.subtitle`)}</p>
          </div>

          <div className="flex-1">{children}</div>

          {!embedded ? (
            <div className="mt-8 flex items-center justify-center gap-2 lg:hidden">
              <ThemeToggle compact />
              {mode === "onboarding" ? <FocusedDashboardUserMenu variant="compact" /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex w-full justify-center py-2">
        {card}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-muted/25 p-3 sm:p-4 lg:p-6 dark:bg-background">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-[1040px] items-start justify-center lg:min-h-[calc(100dvh-3rem)] lg:items-center">
        {card}
      </div>
    </div>
  );
}
