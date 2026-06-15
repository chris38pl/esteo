"use client";

import { AlignLeft, Mic, MicOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { IssueFormTextarea } from "@/features/issues/components/issue-form-fields";
import { useSpeechRecognition } from "@/features/issues/hooks/use-speech-recognition";
import { Button } from "@/components/ui/button";
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
    <IssueFormTextarea
      id="issue-description"
      label={t("form.description")}
      value={value}
      onChange={onChange}
      placeholder={t("form.descriptionPlaceholder")}
      required
      disabled={disabled}
      rows={5}
      icon={<AlignLeft className="size-4" />}
      className={cn(isListening && "ring-2 ring-primary/40")}
      headerAction={
        isSupported ? (
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            className="h-8 shrink-0"
            disabled={disabled}
            onClick={() => toggleListening(appendTranscript)}
          >
            {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            {isListening ? t("form.stopRecording") : t("form.recordDescription")}
          </Button>
        ) : null
      }
    />
  );
}
