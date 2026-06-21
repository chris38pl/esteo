import {
  TIPS_CAROUSEL_SLIDE_SIZE,
  type TipCatalogEntry,
  type TipId,
} from "@/features/tips/lib/tips-catalog";

function chunkTips<T>(items: T[], size: number): T[][] {
  const slides: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    slides.push(items.slice(index, index + size));
  }
  return slides;
}

export function buildTipsCarouselSlides(
  catalog: TipCatalogEntry[],
  options: {
    pinnedIds: TipId[];
    dismissedIds: TipId[];
    slideSize?: number;
  },
): TipCatalogEntry[][] {
  const slideSize = options.slideSize ?? TIPS_CAROUSEL_SLIDE_SIZE;
  const catalogById = new Map(catalog.map((entry) => [entry.id, entry]));
  const dismissedSet = new Set(options.dismissedIds);

  const pinned = options.pinnedIds
    .map((id) => catalogById.get(id))
    .filter((entry): entry is TipCatalogEntry => entry != null);

  const pinnedSet = new Set(pinned.map((entry) => entry.id));
  const pool = catalog.filter(
    (entry) => !pinnedSet.has(entry.id) && !dismissedSet.has(entry.id),
  );

  const slide0FillCount = Math.max(0, slideSize - pinned.length);
  const slide0 = [...pinned, ...pool.slice(0, slide0FillCount)];
  const remainingPool = pool.slice(slide0FillCount);
  const otherSlides = chunkTips(remainingPool, slideSize);

  const slides = slide0.length > 0 ? [slide0, ...otherSlides] : otherSlides;
  return slides.filter((slide) => slide.length > 0);
}

export function countTipsInSlides(slides: TipCatalogEntry[][]): number {
  return slides.reduce((total, slide) => total + slide.length, 0);
}
