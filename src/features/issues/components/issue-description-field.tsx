"use client";

import { Mic, MicOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { useSpeechRecognition } from "@/features/issues/hooks/use-speech-recognition";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function IssueDescriptionField({
  locale,
  value,
  onChange,
  disabled,
}: {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("issues");
  const { isListening, isSupported, toggleListening } = useSpeechRecognition(locale);

  function appendTranscript(text: string) {
    const trimmed = value.trim();
    onChange(trimmed.length > 0 ? `${trimmed}\n\n${text}` : text);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="issue-description">{t("form.description")}</Label>
        {isSupported ? (
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            disabled={disabled}
            onClick={() => toggleListening(appendTranscript)}
          >
            {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            {isListening ? t("form.stopRecording") : t("form.recordDescription")}
          </Button>
        ) : null}
      </div>
      <Textarea
        id="issue-description"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("form.descriptionPlaceholder")}
        rows={4}
        disabled={disabled}
        className={cn(isListening && "ring-2 ring-primary/40")}
      />
    </div>
  );
}
