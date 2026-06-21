"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import { ArrowDown, ArrowUp, Clock, CornerDownLeft, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInputBare,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRecentDocumentsCache } from "@/features/search/hooks/use-recent-documents-cache";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from "@/features/search/lib/recent-searches";
import type {
  RecentDocumentItem,
  SearchResultItem,
  SearchWorkspaceResult,
} from "@/features/search/lib/search-types";
import {
  recordRecentDocumentAction,
  searchWorkspaceAction,
} from "@/features/search/server/actions";
import { cn } from "@/lib/utils";

import { useGlobalSearch } from "./global-search-provider";
import {
  entityTypeLabel,
  RecentDocumentRow,
  SearchGroupIcon,
  SearchResultItemContent,
  TipSearchResultItemContent,
} from "./search-result-item";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

type NavigableItem = {
  key: string;
  url: string;
  title: string;
  subtitle?: string;
  iconType?: SearchResultItem["iconType"];
  entityType?: SearchResultItem["entityType"];
  entityId?: string;
  skipRecentRecord?: boolean;
};

type SearchGroupKey = "estimates" | "inquiries" | "attachments" | "tips";

export function GlobalSearchDialog() {
  const t = useTranslations("search");
  const locale = useLocale() as "pl" | "en";
  const router = useRouter();
  const { open, setOpen } = useGlobalSearch();
  const { activeWorkspace, activeWorkspaceId } = useWorkspaceContext();
  const { items: recentDocuments, load: loadRecent, invalidate } = useRecentDocumentsCache(
    activeWorkspaceId,
    locale,
  );

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchWorkspaceResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const lastSavedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
      setResults(null);
      lastSavedQueryRef.current = null;
      return;
    }

    if (activeWorkspaceId) {
      void loadRecent();
      setRecentSearches(getRecentSearches(activeWorkspaceId));
    }
  }, [open, activeWorkspaceId, loadRecent]);

  useEffect(() => {
    if (!open || !activeWorkspaceId) {
      return;
    }

    if (debouncedQuery.trim().length < MIN_QUERY_LENGTH) {
      setResults(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    void searchWorkspaceAction({
      workspaceId: activeWorkspaceId,
      query: debouncedQuery,
      locale,
    })
      .then((next) => {
        if (!cancelled) {
          setResults(next);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open, activeWorkspaceId, locale]);

  // Persist completed searches (not only on result click).
  useEffect(() => {
    if (!open || !activeWorkspaceId || searching) {
      return;
    }

    const trimmed = debouncedQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }

    if (lastSavedQueryRef.current === trimmed) {
      return;
    }

    lastSavedQueryRef.current = trimmed;
    setRecentSearches(addRecentSearch(activeWorkspaceId, trimmed));
  }, [debouncedQuery, open, activeWorkspaceId, searching]);

  const showSearchResults = debouncedQuery.trim().length >= MIN_QUERY_LENGTH;
  const dateLocale = locale === "pl" ? pl : enUS;

  const hasResults =
    showSearchResults &&
    results &&
    (results.estimates.length > 0 ||
      results.inquiries.length > 0 ||
      results.attachments.length > 0 ||
      results.tips.length > 0);

  const hasRecents = recentSearches.length > 0 || recentDocuments.length > 0;

  async function handleSelect(item: NavigableItem) {
    if (!activeWorkspaceId) {
      return;
    }

    if (showSearchResults && debouncedQuery.trim()) {
      setRecentSearches(addRecentSearch(activeWorkspaceId, debouncedQuery.trim()));
    }

    if (!item.skipRecentRecord && item.entityType && item.entityId && item.iconType) {
      await recordRecentDocumentAction({
        workspaceId: activeWorkspaceId,
        entityType: item.entityType,
        entityId: item.entityId,
        title: item.title,
        subtitle: item.subtitle,
        iconType: item.iconType,
        locale,
      });

      invalidate();
    }
    setOpen(false);
    router.push(item.url);
  }

  function handleRecentSearchSelect(term: string) {
    setQuery(term);
  }

  if (!activeWorkspaceId || !activeWorkspace) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex h-[min(85vh,700px)] w-[calc(100%-2rem)] max-w-[min(96vw,56rem)] flex-col gap-0 overflow-hidden p-0 outline-none focus:outline-none focus-visible:ring-0 sm:max-w-[min(96vw,56rem)]",
          "max-sm:fixed max-sm:inset-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0",
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t("navbar.label")}</DialogTitle>
          <DialogDescription>{t("placeholder")}</DialogDescription>
        </DialogHeader>

        <Command
          shouldFilter={false}
          className="flex min-h-0 flex-1 flex-col rounded-none bg-transparent outline-none ring-0"
        >
          {/* Single visual search bar — CommandInputBare has no wrapper; focus/hover on shell only */}
          <div className="shrink-0 border-b border-border/60 px-4 py-3">
            <div
              className={cn(
                "relative flex h-11 items-center rounded-xl border border-transparent bg-transparent px-3.5",
                "transition-[border-color,background-color,box-shadow] duration-150",
                "outline-none ring-0",
                "hover:border-border/60 hover:bg-muted/20",
                "focus-within:border-primary/45 focus-within:bg-muted/40 focus-within:shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]",
                "focus-within:ring-0 focus-within:outline-none",
              )}
            >
              <Search className="mr-2.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <CommandInputBare
                value={query}
                onValueChange={setQuery}
                placeholder={t("placeholder")}
                className="h-full min-h-0 flex-1 pr-20"
                autoFocus
              />
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1.5">
                <kbd className="pointer-events-auto hidden rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
                  ESC
                </kbd>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="pointer-events-auto size-8 text-muted-foreground shadow-none ring-0 outline-none focus-visible:ring-0"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col md:basis-[62%] md:border-r md:border-border/60">
              <CommandList className="sidebar-scroll max-h-none min-h-0 flex-1 overflow-y-auto px-2 py-3 pb-4">
                {!showSearchResults && !hasRecents ? (
                  <CommandEmpty className="px-4 py-10 text-left text-sm leading-relaxed">
                    {t("empty.hint")}
                  </CommandEmpty>
                ) : searching ? (
                  <CommandEmpty className="px-4 text-left">…</CommandEmpty>
                ) : !hasResults ? (
                  <CommandEmpty className="px-4 text-left">{t("noResults")}</CommandEmpty>
                ) : (
                  <>
                    {results!.estimates.length > 0 ? (
                      <SearchResultsGroup
                        group="estimates"
                        label={t("groups.estimates")}
                        count={results!.estimates.length}
                      >
                        {results!.estimates.map((item) => (
                          <CommandItem
                            key={`estimate:${item.id}`}
                            value={`estimate:${item.id}`}
                            onSelect={() => void handleSelect(toNavigable(item, "estimate"))}
                          >
                            <SearchResultItemContent
                              iconType={item.iconType}
                              title={item.title}
                              subtitle={item.subtitle}
                              query={debouncedQuery}
                            />
                          </CommandItem>
                        ))}
                      </SearchResultsGroup>
                    ) : null}
                    {results!.inquiries.length > 0 ? (
                      <SearchResultsGroup
                        group="inquiries"
                        label={t("groups.inquiries")}
                        count={results!.inquiries.length}
                      >
                        {results!.inquiries.map((item) => (
                          <CommandItem
                            key={`inquiry:${item.id}`}
                            value={`inquiry:${item.id}`}
                            onSelect={() => void handleSelect(toNavigable(item, "inquiry"))}
                          >
                            <SearchResultItemContent
                              iconType={item.iconType}
                              title={item.title}
                              subtitle={item.subtitle}
                              query={debouncedQuery}
                            />
                          </CommandItem>
                        ))}
                      </SearchResultsGroup>
                    ) : null}
                    {results!.attachments.length > 0 ? (
                      <SearchResultsGroup
                        group="attachments"
                        label={t("groups.attachments")}
                        count={results!.attachments.length}
                      >
                        {results!.attachments.map((item) => (
                          <CommandItem
                            key={`attachment:${item.id}`}
                            value={`attachment:${item.id}`}
                            onSelect={() => void handleSelect(toNavigable(item, "attachment"))}
                          >
                            <SearchResultItemContent
                              iconType={item.iconType}
                              title={item.title}
                              subtitle={item.subtitle}
                              query={debouncedQuery}
                            />
                          </CommandItem>
                        ))}
                      </SearchResultsGroup>
                    ) : null}
                    {results!.tips.length > 0 ? (
                      <SearchResultsGroup
                        group="tips"
                        label={t("groups.tips")}
                        count={results!.tips.length}
                      >
                        {results!.tips.map((item) => (
                          <CommandItem
                            key={`tip:${item.id}`}
                            value={`tip:${item.id}`}
                            onSelect={() =>
                              void handleSelect({
                                key: `tip:${item.id}`,
                                url: item.url,
                                title: item.title,
                                subtitle: item.subtitle,
                                skipRecentRecord: true,
                              })
                            }
                          >
                            <TipSearchResultItemContent
                              title={item.title}
                              subtitle={item.subtitle}
                              query={debouncedQuery}
                            />
                          </CommandItem>
                        ))}
                      </SearchResultsGroup>
                    ) : null}
                  </>
                )}
              </CommandList>
            </div>

            <SearchRecentsSidebar
              className="flex"
              recentSearches={recentSearches}
              recentDocuments={recentDocuments}
              dateLocale={dateLocale}
              onClearSearches={() => {
                clearRecentSearches(activeWorkspaceId);
                setRecentSearches([]);
              }}
              onSelectSearch={handleRecentSearchSelect}
              onRemoveSearch={(term) =>
                setRecentSearches(removeRecentSearch(activeWorkspaceId, term))
              }
              onSelectDocument={(item) =>
                void handleSelect({
                  key: item.id,
                  url: item.url,
                  title: item.title,
                  subtitle: item.subtitle,
                  iconType: item.iconType,
                  entityType: item.entityType,
                  entityId: item.id,
                })
              }
              entityTypeLabel={(entityType) => entityTypeLabel(t, entityType)}
            />
          </div>

          <div className="mt-1 flex shrink-0 items-center justify-between gap-6 border-t border-border/60 px-6 py-4 text-sm text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2.5">
              <Sparkles className="size-4 shrink-0" />
              <span className="truncate leading-relaxed">{t("empty.hint")}</span>
            </div>
            <div className="hidden shrink-0 items-center gap-5 sm:flex">
              <span className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <SearchFooterKey>
                    <ArrowUp className="size-3" strokeWidth={2} />
                  </SearchFooterKey>
                  <SearchFooterKey>
                    <ArrowDown className="size-3" strokeWidth={2} />
                  </SearchFooterKey>
                </span>
                <span className="text-xs">{t("footer.navigation")}</span>
              </span>
              <span className="h-4 w-px bg-border/80" aria-hidden />
              <span className="flex items-center gap-2">
                <SearchFooterKey>
                  <CornerDownLeft className="size-3" strokeWidth={2} />
                </SearchFooterKey>
                <span className="text-xs">{t("footer.open")}</span>
              </span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function SearchFooterKey({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex size-6 items-center justify-center rounded-md border border-border/70 bg-muted/40 text-muted-foreground shadow-sm">
      {children}
    </kbd>
  );
}

function SearchResultsGroup({
  group,
  label,
  count,
  children,
}: {
  group: SearchGroupKey;
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <CommandGroup className="mb-2 [&_[cmdk-group-heading]]:hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <SearchGroupIcon group={group} />
        <span>
          {label} ({count})
        </span>
      </div>
      {children}
    </CommandGroup>
  );
}

function SearchRecentsSidebar({
  className,
  recentSearches,
  recentDocuments,
  dateLocale,
  onClearSearches,
  onSelectSearch,
  onRemoveSearch,
  onSelectDocument,
  entityTypeLabel: entityTypeLabelFn,
}: {
  className?: string;
  recentSearches: string[];
  recentDocuments: RecentDocumentItem[];
  dateLocale: typeof pl;
  onClearSearches: () => void;
  onSelectSearch: (term: string) => void;
  onRemoveSearch: (term: string) => void;
  onSelectDocument: (item: RecentDocumentItem) => void;
  entityTypeLabel: (entityType: RecentDocumentItem["entityType"]) => string;
}) {
  const t = useTranslations("search");

  return (
    <aside
      className={cn(
        "sidebar-scroll min-h-0 w-full shrink-0 flex-col gap-6 overflow-y-auto border-t border-border/60 p-5 md:w-[38%] md:min-w-[15.5rem] md:max-w-[21rem] md:border-t-0",
        className,
      )}
    >
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("recentSearches")}
          </p>
          {recentSearches.length > 0 ? (
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-primary hover:text-primary/80"
              onClick={onClearSearches}
            >
              {t("clear")}
            </button>
          ) : null}
        </div>
        <div className="space-y-1">
          {recentSearches.length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">—</p>
          ) : (
            recentSearches.map((term) => (
              <div
                key={term}
                className="flex items-center gap-1 rounded-xl px-2 py-2.5 hover:bg-accent/50"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-sm"
                  onClick={() => onSelectSearch(term)}
                >
                  <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Remove"
                  onClick={() => onRemoveSearch(term)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("recentDocuments")}
        </p>
        {recentDocuments.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">—</p>
        ) : (
          <div className="space-y-1">
            {recentDocuments.slice(0, 5).map((item) => (
              <button
                key={`side:${item.id}`}
                type="button"
                className="w-full rounded-xl px-2 py-2.5 text-left hover:bg-accent/50"
                onClick={() => onSelectDocument(item)}
              >
                <RecentDocumentRow
                  iconType={item.iconType}
                  title={item.title}
                  meta={`${entityTypeLabelFn(item.entityType)} • ${formatDistanceToNow(new Date(item.lastOpenedAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function toNavigable(item: SearchResultItem, prefix: string): NavigableItem {
  return {
    key: `${prefix}:${item.id}`,
    url: item.url,
    title: item.title,
    subtitle: item.subtitle,
    iconType: item.iconType,
    entityType: item.entityType,
    entityId: item.id,
  };
}
