"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function DescriptionContent({
  displayDescription,
  contentKey,
  isEditing,
  draft,
  onDraftChange,
  onSave,
  onCancelEdit,
  onStartEdit,
  scrollClassName,
}: {
  displayDescription: string;
  contentKey: string;
  isEditing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  scrollClassName: string;
}) {
  const t = useTranslations("voiceIntake.review");

  if (isEditing) {
    return (
      <div className="space-y-3">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          className={cn(
            "w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-3 text-sm leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            scrollClassName,
          )}
          rows={8}
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={onSave}>
            {t("saveDescription")}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>
            {t("cancelEdit")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        key={contentKey}
        className={cn(
          "overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90",
          scrollClassName,
        )}
      >
        {displayDescription}
      </div>
      <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={onStartEdit}>
        {t("editDescription")}
      </Button>
    </div>
  );
}

export function VoiceInvestmentDescription({
  displayDescription,
  contentKey,
  onSaveEdit,
}: {
  displayDescription: string;
  contentKey: string;
  onSaveEdit: (value: string) => void;
}) {
  const t = useTranslations("voiceIntake.review");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(displayDescription);

  function startEdit() {
    setDraft(displayDescription);
    setIsEditing(true);
  }

  function saveEdit() {
    onSaveEdit(draft.trim());
    setIsEditing(false);
  }

  function cancelEdit() {
    setDraft(displayDescription);
    setIsEditing(false);
  }

  const contentProps = {
    displayDescription,
    contentKey,
    isEditing,
    draft,
    onDraftChange: setDraft,
    onSave: saveEdit,
    onCancelEdit: cancelEdit,
    onStartEdit: startEdit,
  };

  return (
    <>
      {/* Mobile: accordion */}
      <div className="rounded-2xl border border-border/50 bg-muted/10 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm text-muted-foreground transition hover:text-foreground"
          aria-expanded={mobileOpen}
        >
          <span>{t("showInvestmentDescription")}</span>
          <ChevronDown
            className={cn("size-4 shrink-0 transition-transform", mobileOpen && "rotate-180")}
          />
        </button>
        {mobileOpen ? (
          <div className="border-t border-border/50 px-4 py-4">
            <DescriptionContent {...contentProps} scrollClassName="max-h-[240px]" />
          </div>
        ) : null}
      </div>

      {/* Desktop: always visible panel */}
      <section className="hidden min-h-0 flex-col lg:flex">
        <h3 className="mb-3 text-base font-semibold tracking-tight text-foreground">
          {t("investmentDescriptionHeading")}
        </h3>
        <DescriptionContent {...contentProps} scrollClassName="max-h-[min(50vh,400px)]" />
      </section>
    </>
  );
}
