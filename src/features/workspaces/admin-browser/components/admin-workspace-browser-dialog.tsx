"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Clock, Search, User, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { WorkspaceAvatar } from "@/components/avatars/workspace-avatar";
import { Button } from "@/components/ui/button";
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
import { IndeterminateLoadingBar } from "@/components/ui/indeterminate-loading-bar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { dashboardEstimatesHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

import {
  addRecentAdminWorkspace,
  addRecentAdminWorkspaceSearch,
  clearRecentAdminWorkspaceSearches,
  getRecentAdminWorkspaceSearches,
  getRecentAdminWorkspaces,
  removeRecentAdminWorkspaceSearch,
  type RecentAdminWorkspace,
} from "../lib/recent-admin-workspaces";
import type { AdminWorkspaceSearchResult } from "../lib/types";
import { searchAdminWorkspacesAction } from "../server/actions";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function AdminWorkspaceBrowserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("workspaceAdminBrowser");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<AdminWorkspaceSearchResult[]>([]);
  const [completedQuery, setCompletedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentAdminWorkspace[]>([]);
  const lastSavedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  function resetState() {
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setCompletedQuery("");
    lastSavedQueryRef.current = null;
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetState();
    } else {
      setRecentSearches(getRecentAdminWorkspaceSearches());
      setRecentWorkspaces(getRecentAdminWorkspaces());
    }

    onOpenChange(nextOpen);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const trimmed = debouncedQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }

    let cancelled = false;

    void searchAdminWorkspacesAction({ query: trimmed, locale, limit: 8 })
      .then((next) => {
        if (!cancelled) {
          setResults(next);
          setCompletedQuery(trimmed);
        }
      }).catch(() => {
        if (!cancelled) {
          setResults([]);
          setCompletedQuery(trimmed);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, locale, open]);

  const trimmedDebouncedQuery = debouncedQuery.trim();
  const isSearchLoading =
    open &&
    trimmedDebouncedQuery.length >= MIN_QUERY_LENGTH &&
    completedQuery !== trimmedDebouncedQuery;

  useEffect(() => {
    if (!open || isSearchLoading) {
      return;
    }

    const trimmed = debouncedQuery.trim();
    if (trimmed.length < MIN_QUERY_LENGTH || lastSavedQueryRef.current === trimmed) {
      return;
    }

    lastSavedQueryRef.current = trimmed;
    setRecentSearches(addRecentAdminWorkspaceSearch(trimmed));
  }, [debouncedQuery, isSearchLoading, open]);

  function handleSelectWorkspace(workspace: AdminWorkspaceSearchResult | RecentAdminWorkspace) {
    setRecentWorkspaces(addRecentAdminWorkspace(workspace));
    handleOpenChange(false);
    router.push(dashboardEstimatesHref(locale, workspace.slug));
  }

  const content = (
    <BrowserContent
      query={query}
      setQuery={setQuery}
      results={results}
      searching={isSearchLoading}
      showSearchResults={debouncedQuery.trim().length >= MIN_QUERY_LENGTH}
      recentSearches={recentSearches}
      recentWorkspaces={recentWorkspaces}
      onSelectWorkspace={handleSelectWorkspace}
      onSelectRecentSearch={setQuery}
      onClearSearches={() => {
        clearRecentAdminWorkspaceSearches();
        setRecentSearches([]);
      }}
      onRemoveSearch={(term) => setRecentSearches(removeRecentAdminWorkspaceSearch(term))}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlayClassName="z-[90]"
          className="z-[90] h-[92dvh] max-h-[92dvh] overflow-hidden p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("title")}</SheetTitle>
            <SheetDescription>{t("description")}</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[90]"
        className="z-[90] flex h-[min(78vh,620px)] w-[calc(100%-2rem)] max-w-[min(94vw,46rem)] flex-col gap-0 overflow-hidden p-0 outline-none focus:outline-none focus-visible:ring-0 sm:max-w-[min(94vw,46rem)]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function BrowserContent({
  query,
  setQuery,
  results,
  searching,
  showSearchResults,
  recentSearches,
  recentWorkspaces,
  onSelectWorkspace,
  onSelectRecentSearch,
  onClearSearches,
  onRemoveSearch,
}: {
  query: string;
  setQuery: (query: string) => void;
  results: AdminWorkspaceSearchResult[];
  searching: boolean;
  showSearchResults: boolean;
  recentSearches: string[];
  recentWorkspaces: RecentAdminWorkspace[];
  onSelectWorkspace: (workspace: AdminWorkspaceSearchResult | RecentAdminWorkspace) => void;
  onSelectRecentSearch: (term: string) => void;
  onClearSearches: () => void;
  onRemoveSearch: (term: string) => void;
}) {
  const t = useTranslations("workspaceAdminBrowser");
  const hasResults = showSearchResults && results.length > 0;
  const hasRecents = recentSearches.length > 0 || recentWorkspaces.length > 0;

  return (
    <Command
      shouldFilter={false}
      className="flex min-h-0 flex-1 flex-col rounded-none bg-transparent outline-none ring-0"
    >
      <div className="shrink-0 border-b border-border/60 px-4 py-3">
        <div
          className={cn(
            "relative flex h-11 items-center rounded-xl border border-transparent bg-transparent px-3.5",
            "transition-[border-color,background-color,box-shadow] duration-150",
            "hover:border-border/60 hover:bg-muted/20",
            "focus-within:border-primary/45 focus-within:bg-muted/40 focus-within:shadow-[0_0_0_1px_hsl(var(--primary)/0.12)]",
          )}
        >
          <Search className="mr-2.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <CommandInputBare
            value={query}
            onValueChange={setQuery}
            placeholder={t("placeholder")}
            className="h-full min-h-0 flex-1 pr-12"
            autoFocus
          />
          {query ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 size-8 text-muted-foreground shadow-none ring-0 outline-none focus-visible:ring-0"
              onClick={() => setQuery("")}
              aria-label={t("clearInput")}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:border-r md:border-border/60">
          {searching ? <IndeterminateLoadingBar label={t("loading")} /> : null}
          <CommandList className="sidebar-scroll max-h-none min-h-0 flex-1 overflow-y-auto px-2 py-3 pb-4">
            {!showSearchResults && !hasRecents ? (
              <CommandEmpty className="px-4 py-10 text-left text-sm leading-relaxed">
                {t("empty.hint")}
              </CommandEmpty>
            ) : !showSearchResults ? (
              hasRecents ? (
                <CommandEmpty className="hidden px-4 py-10 text-left text-sm leading-relaxed md:block">
                  {t("empty.hint")}
                </CommandEmpty>
              ) : null
            ) : !hasResults && !searching ? (
              <CommandEmpty className="px-4 text-left">{t("noResults")}</CommandEmpty>
            ) : hasResults ? (
              <CommandGroup className="mb-2 [&_[cmdk-group-heading]]:hidden">
                <SectionHeading icon={<Search className="size-3.5" />} label={t("results")} />
                {results.map((workspace) => (
                  <CommandItem
                    key={workspace.id}
                    value={`workspace:${workspace.id}`}
                    onSelect={() => onSelectWorkspace(workspace)}
                  >
                    <WorkspaceRow workspace={workspace} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </div>

        <RecentSidebar
          recentSearches={recentSearches}
          recentWorkspaces={recentWorkspaces}
          onClearSearches={onClearSearches}
          onSelectSearch={onSelectRecentSearch}
          onRemoveSearch={onRemoveSearch}
          onSelectWorkspace={onSelectWorkspace}
        />
      </div>
    </Command>
  );
}

function RecentSidebar({
  recentSearches,
  recentWorkspaces,
  onClearSearches,
  onSelectSearch,
  onRemoveSearch,
  onSelectWorkspace,
}: {
  recentSearches: string[];
  recentWorkspaces: RecentAdminWorkspace[];
  onClearSearches: () => void;
  onSelectSearch: (term: string) => void;
  onRemoveSearch: (term: string) => void;
  onSelectWorkspace: (workspace: RecentAdminWorkspace) => void;
}) {
  const t = useTranslations("workspaceAdminBrowser");

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col gap-5 border-t border-border/60 p-4",
        "max-md:gap-3 max-md:overflow-hidden max-md:p-3",
        "md:sidebar-scroll md:min-h-0 md:w-[18rem] md:overflow-y-auto md:border-t-0",
      )}
    >
      <div className="min-h-0 shrink-0">
        <div className="mb-2 flex items-center justify-between gap-2">
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
        {recentSearches.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">-</p>
        ) : (
          <div className="sidebar-scroll max-md:max-h-[5.25rem] max-md:overflow-y-auto max-md:pr-0.5 md:space-y-1">
            {recentSearches.map((term) => (
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
                  aria-label={t("removeSearch")}
                  onClick={() => onRemoveSearch(term)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 shrink-0">
        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("recentWorkspaces")}
        </p>
        {recentWorkspaces.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">-</p>
        ) : (
          <div className="sidebar-scroll max-md:max-h-[9rem] max-md:overflow-y-auto max-md:pr-0.5 md:space-y-1">
            {recentWorkspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                className="w-full rounded-xl px-2 py-2.5 text-left hover:bg-accent/50"
                onClick={() => onSelectWorkspace(workspace)}
              >
                <WorkspaceRow workspace={workspace} compact />
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function SectionHeading({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function WorkspaceRow({
  workspace,
  compact = false,
}: {
  workspace: AdminWorkspaceSearchResult | RecentAdminWorkspace;
  compact?: boolean;
}) {
  const ownerLabel = workspace.ownerName
    ? `${workspace.ownerName} · ${workspace.ownerEmail}`
    : workspace.ownerEmail;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <WorkspaceAvatar
        name={workspace.name}
        logoUrl={workspace.logoUrl}
        size={compact ? 28 : 34}
        className="rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{workspace.name}</p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground">
          <User className="size-3 shrink-0" />
          <span className="truncate">{ownerLabel}</span>
        </p>
      </div>
      {!compact ? (
        <span className="hidden shrink-0 rounded-md bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground sm:block">
          /{workspace.slug}
        </span>
      ) : null}
    </div>
  );
}

function useIsMobile(): boolean {
  return useSyncExternalStore(subscribeToMobileBreakpoint, getMobileSnapshot, getServerSnapshot);
}

function subscribeToMobileBreakpoint(onStoreChange: () => void): () => void {
  const media = window.matchMedia("(max-width: 767px)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getMobileSnapshot(): boolean {
  return window.matchMedia("(max-width: 767px)").matches;
}

function getServerSnapshot(): boolean {
  return false;
}
