"use client";

import { Bug, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  ESTIMATES_LIST_HERO_IMAGES,
} from "@/features/estimates/lib/estimates-list-hero-images";
import { cn } from "@/lib/utils";

const issueHeroButtonClassName = cn(
  "inline-flex min-h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium shadow-xs [&_svg]:shrink-0",
  "bg-amber-800 text-white hover:bg-amber-900 dark:bg-amber-700 dark:text-white dark:hover:bg-amber-800",
);

function IssuesHeroStyles() {
  const light = "#fff7ed";
  const dark = "#1a1208";

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.issues-list-hero-card {
  --hero-card-bg: ${light};
  background-color: ${light};
}
.dark .issues-list-hero-card {
  --hero-card-bg: ${dark};
  background-color: ${dark};
}
.issues-list-hero-text-scrim {
  pointer-events: none;
  position: absolute;
  inset-block: 0;
  left: 0;
  z-index: 1;
  width: min(70%, 24rem);
  background: linear-gradient(
    90deg,
    var(--hero-card-bg) 0%,
    var(--hero-card-bg) 36%,
    color-mix(in oklab, var(--hero-card-bg) 78%, transparent) 58%,
    transparent 100%
  );
}
.issues-list-hero-body {
  position: relative;
  z-index: 10;
}
.issues-list-hero-content {
  max-width: min(68%, 26rem);
}
@media (max-width: 768px) {
  .issues-list-hero-text-scrim {
    width: min(94%, 100%);
  }
  .issues-list-hero-content {
    max-width: min(90%, 100%);
  }
}
`.trim(),
      }}
    />
  );
}

export function IssuesListHeroCard({ onCreateIssue }: { onCreateIssue: () => void }) {
  const t = useTranslations("issues");

  return (
    <>
      <IssuesHeroStyles />
      <article
        className={cn(
          "issues-list-hero-card surface-card relative isolate min-h-[11.5rem] overflow-hidden border-amber-200/40 md:min-h-[12.5rem] dark:border-amber-900/30",
        )}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ESTIMATES_LIST_HERO_IMAGES.create.light}
            alt=""
            className="absolute top-0 right-0 block h-full w-auto max-w-none select-none"
          />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden dark:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ESTIMATES_LIST_HERO_IMAGES.create.dark}
            alt=""
            className="absolute top-0 right-0 block h-full w-auto max-w-none select-none"
          />
        </div>
        <div aria-hidden className="issues-list-hero-text-scrim" />

        <div className="issues-list-hero-body flex min-h-[11.5rem] flex-col justify-between gap-5 p-6 md:min-h-[12.5rem] md:p-8">
          <div className="issues-list-hero-content">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-500">
              {t("list.hero.eyebrow")}
            </p>
            <h2 className="mt-4 mb-5 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {t("list.hero.title")}
            </h2>
            <div className="space-y-0.5 text-sm leading-relaxed text-muted-foreground">
              <p>{t("list.hero.descriptionLine1")}</p>
              <p>{t("list.hero.descriptionLine2")}</p>
            </div>
          </div>

          <Button type="button" className={issueHeroButtonClassName} onClick={onCreateIssue}>
            <Bug className="size-4" />
            {t("list.hero.cta")}
            <Plus className="size-4" />
          </Button>
        </div>
      </article>
    </>
  );
}
