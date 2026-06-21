"use client";

import { MoreHorizontal, Search } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TIP_CATEGORY_IDS, type TipCategoryId } from "@/features/tips/lib/tips-catalog";
import { cn } from "@/lib/utils";

export type TipsFilterCategory = "all" | TipCategoryId;

const CHIP_GAP_PX = 6;
const MORE_BUTTON_WIDTH_PX = 36;
const SEARCH_MIN_WIDTH_PX = 160;

type CategoryOption = {
  id: TipsFilterCategory;
  label: string;
};

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-border/70 bg-background/40 text-foreground hover:bg-muted/60",
      )}
    >
      {label}
    </button>
  );
}

export function TipsCategoryFilterBar({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchQueryChange,
}: {
  activeCategory: TipsFilterCategory;
  onCategoryChange: (category: TipsFilterCategory) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}) {
  const t = useTranslations("tips");
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(TIP_CATEGORY_IDS.length + 1);

  const categories = useMemo<CategoryOption[]>(
    () => [
      { id: "all", label: t("page.filterAll") },
      ...TIP_CATEGORY_IDS.map((id) => ({
        id,
        label: t(`categories.${id}`),
      })),
    ],
    [t],
  );

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      const measureRow = measureRef.current;
      const searchEl = searchRef.current;
      if (!container || !measureRow || !searchEl) {
        return;
      }

      const chipEls = Array.from(measureRow.children) as HTMLElement[];
      if (chipEls.length === 0) {
        return;
      }

      const containerWidth = container.clientWidth;
      const searchWidth = Math.max(searchEl.offsetWidth, SEARCH_MIN_WIDTH_PX);
      const rowGap = 8;

      function widthForCount(count: number, reserveMore: boolean) {
        const moreWidth = reserveMore ? MORE_BUTTON_WIDTH_PX + CHIP_GAP_PX : 0;
        let total = 0;
        for (let index = 0; index < count; index++) {
          total += chipEls[index].offsetWidth;
          if (index > 0) {
            total += CHIP_GAP_PX;
          }
        }
        return total + moreWidth;
      }

      const maxWithoutMore = containerWidth - searchWidth - rowGap;
      let count = chipEls.length;

      while (count > 1 && widthForCount(count, false) > maxWithoutMore) {
        count -= 1;
      }

      if (count < chipEls.length) {
        const maxWithMore = containerWidth - searchWidth - rowGap;
        while (count > 1 && widthForCount(count, true) > maxWithMore) {
          count -= 1;
        }
      }

      setVisibleCount(Math.max(1, count));
    }

    measure();

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [categories]);

  const { visibleCategories, overflowCategories } = useMemo(() => {
    if (visibleCount >= categories.length) {
      return { visibleCategories: categories, overflowCategories: [] as CategoryOption[] };
    }

    let visible = categories.slice(0, visibleCount);
    let overflow = categories.slice(visibleCount);

    if (activeCategory !== "all" && overflow.some((item) => item.id === activeCategory)) {
      const activeOption = categories.find((item) => item.id === activeCategory);
      if (activeOption) {
        if (visible.length > 1) {
          const dropped = visible[visible.length - 1];
          visible = [...visible.slice(0, -1), activeOption];
          overflow = [
            dropped,
            ...overflow.filter((item) => item.id !== activeCategory),
          ].filter(
            (item, index, array) => array.findIndex((entry) => entry.id === item.id) === index,
          );
        } else {
          visible = [categories[0], activeOption];
          overflow = categories.filter(
            (item) => item.id !== "all" && item.id !== activeCategory,
          );
        }
      }
    }

    return { visibleCategories: visible, overflowCategories: overflow };
  }, [activeCategory, categories, visibleCount]);

  return (
    <div
      ref={containerRef}
      className="relative flex min-w-0 items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2 md:p-2.5"
    >
      <div
        ref={measureRef}
        className="pointer-events-none invisible absolute flex gap-1.5"
        aria-hidden
      >
        {categories.map((category) => (
          <span
            key={category.id}
            className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium"
          >
            {category.label}
          </span>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {visibleCategories.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.label}
            active={activeCategory === category.id}
            onClick={() => onCategoryChange(category.id)}
          />
        ))}

        {overflowCategories.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/40 text-foreground transition-colors hover:bg-muted/60",
                  overflowCategories.some((item) => item.id === activeCategory) &&
                    "border-primary/40 bg-primary/10 text-primary",
                )}
                aria-label={t("page.moreCategories")}
              >
                <MoreHorizontal className="size-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[12rem]">
              {overflowCategories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={cn(activeCategory === category.id && "bg-accent font-medium")}
                >
                  {category.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div ref={searchRef} className="relative w-full min-w-[9.5rem] max-w-[14rem] shrink-0 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder={t("page.searchPlaceholder")}
          className="h-9 w-full rounded-lg border-border/70 bg-background pl-9 text-sm shadow-xs"
        />
      </div>
    </div>
  );
}
