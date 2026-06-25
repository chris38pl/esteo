"use client";

import { useEffect, useState } from "react";
import { AlignLeft, ListOrdered, Mic, MicOff, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { appToast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateGenerationMode } from "@/ai/prompts/template-generation";
import { useSpeechRecognition } from "@/features/issues/hooks/use-speech-recognition";
import {
  storeTemplateAiSession,
  TEMPLATE_AI_OPEN_QUERY_PARAM,
} from "@/features/estimate-templates/lib/template-ai-storage";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const MIN_OUTLINE_LENGTH = 20;
const MAX_OUTLINE_LENGTH = 12_000;

export function GenerateTemplateAiDialog({
  open,
  onOpenChange,
  workspaceSlug,
  locale,
  isMobile = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  locale: Locale;
  isMobile?: boolean;
}) {
  const t = useTranslations("workspaces.configuration.templates.ai");
  const tIssues = useTranslations("issues");
  const router = useRouter();
  const { isListening, isSupported, toggleListening, stopListening } = useSpeechRecognition(locale);
  const [outline, setOutline] = useState("");
  const [generationMode, setGenerationMode] = useState<TemplateGenerationMode>("enhance");

  useEffect(() => {
    if (!open) {
      stopListening();
    }
  }, [open, stopListening]);

  const trimmedOutline = outline.trim();
  const canSubmit =
    trimmedOutline.length >= MIN_OUTLINE_LENGTH && trimmedOutline.length <= MAX_OUTLINE_LENGTH;

  function appendTranscript(text: string) {
    setOutline((current) => {
      const trimmed = current.trim();
      return trimmed.length > 0 ? `${trimmed}\n\n${text}` : text;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      if (trimmedOutline.length < MIN_OUTLINE_LENGTH) {
        appToast.error(t("promptTooShort"));
      }
      return;
    }

    stopListening();
    storeTemplateAiSession(trimmedOutline, generationMode);
    onOpenChange(false);
    router.push(
      `/${locale}/dashboard/${workspaceSlug}/configuration/templates/new?source=ai`,
    );
  }

  const outlineField = (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="template-ai-outline">{t("outlineLabel")}</Label>
        {isSupported ? (
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            className="h-8 shrink-0"
            onClick={() => toggleListening(appendTranscript)}
          >
            {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            {isListening ? tIssues("form.stopRecording") : tIssues("form.recordDescription")}
          </Button>
        ) : null}
      </div>
      <Textarea
        id="template-ai-outline"
        value={outline}
        onChange={(event) => setOutline(event.target.value)}
        placeholder={t("outlinePlaceholder")}
        rows={isMobile ? 8 : 12}
        maxLength={MAX_OUTLINE_LENGTH}
        className={cn("resize-y", isListening && "ring-2 ring-primary/40")}
      />
      <p className="text-xs text-muted-foreground">{t("outlineHint")}</p>
    </div>
  );

  const modeField = (
    <div className="space-y-3">
      <Label>{t("modeLabel")}</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            {
              value: "enhance" as const,
              title: t("modeEnhance"),
              hint: t("modeEnhanceHint"),
              icon: Wand2,
            },
            {
              value: "faithful" as const,
              title: t("modeFaithful"),
              hint: t("modeFaithfulHint"),
              icon: ListOrdered,
            },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setGenerationMode(option.value)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              generationMode === option.value
                ? "border-primary bg-primary/5"
                : "border-border/70 hover:border-primary/40",
            )}
          >
            <div className="flex gap-3">
              <option.icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  generationMode === option.value ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{option.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{option.hint}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const submitButton = (
    <Button type="submit" disabled={!canSubmit || isListening} className="gap-2">
      <Sparkles className="size-4" />
      {t("submit")}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <SheetHeader>
              <SheetTitle>{t("dialogTitle")}</SheetTitle>
              <SheetDescription>{t("dialogDescription")}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-5 py-4">
              {modeField}
              {outlineField}
            </div>
            <SheetFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
              {submitButton}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlignLeft className="size-5 text-primary" />
              {t("dialogTitle")}
            </DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {modeField}
            {outlineField}
          </div>
          <DialogFooter>{submitButton}</DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function templatesListHrefWithAiOpen(locale: Locale, workspaceSlug: string): string {
  return `/${locale}/dashboard/${workspaceSlug}/configuration?tab=templates&${TEMPLATE_AI_OPEN_QUERY_PARAM}=1`;
}
