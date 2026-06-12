"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { NextIntlClientProvider, useTranslations } from "next-intl";

import { VoiceAnalyzingStage } from "@/features/voice-intake/components/voice-analyzing-stage";
import { VoiceErrorStage } from "@/features/voice-intake/components/voice-error-stage";
import { VoiceIntakeFooterBar } from "@/features/voice-intake/components/voice-intake-footer-bar";
import { VoiceIntakeTrigger } from "@/features/voice-intake/components/voice-intake-trigger";
import { VoiceRecordingStage } from "@/features/voice-intake/components/voice-recording-stage";
import { VoiceSummaryStage } from "@/features/voice-intake/components/voice-summary-stage";
import {
  buildVoiceIntakePreviewFixture,
  pickRandomPreviewResolvedItems,
  VOICE_INTAKE_PREVIEW_ERROR_CODES,
  VOICE_INTAKE_PREVIEW_PHASES,
  VOICE_INTAKE_PREVIEW_SCENARIOS,
  type VoiceIntakePreviewPhase,
  type VoiceIntakePreviewScenarioId,
} from "@/features/voice-intake/fixtures/voice-intake-preview.fixture";
import type { ResolvedFieldItem } from "@/features/voice-intake/lib/diff-missing-fields";
import type { VoiceIntakeErrorCode } from "@/features/voice-intake/types";
import type { VoiceRecordingPreviewState } from "@/features/voice-intake/lib/voice-recording-preview";
import { getMessagesForLocale } from "@/i18n/messages";
import type { Locale } from "@/lib/locale";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const noop = () => {};

function VoiceIntakePreviewStage({
  phase,
  fixture,
  followUpResolvedItems,
  recordingPreview,
  errorCode,
}: {
  phase: VoiceIntakePreviewPhase;
  fixture: ReturnType<typeof buildVoiceIntakePreviewFixture>;
  followUpResolvedItems: ResolvedFieldItem[];
  recordingPreview: VoiceRecordingPreviewState;
  errorCode: VoiceIntakeErrorCode;
}) {
  switch (phase) {
    case "trigger":
      return <VoiceIntakeTrigger onClick={noop} />;
    case "footer_trigger":
      return (
        <div className="w-full max-w-md space-y-4">
          <VoiceIntakeFooterBar onClick={noop} />
          <VoiceIntakeFooterBar onClick={noop} floating />
        </div>
      );
    case "recording_initial":
      return (
        <VoiceRecordingStage
          mode="initial"
          onComplete={noop}
          onError={noop}
          preview={recordingPreview}
        />
      );
    case "recording_follow_up":
      return (
        <VoiceRecordingStage
          mode="follow_up"
          locale={fixture.locale}
          missingFields={fixture.missingFields}
          onComplete={noop}
          onError={noop}
          preview={recordingPreview}
        />
      );
    case "summary":
      return (
        <VoiceSummaryStage
          extraction={fixture.extraction}
          cleanedTranscript={fixture.cleanedTranscript}
          locale={fixture.locale}
          missingFields={fixture.missingFields}
          followUpResolvedItems={followUpResolvedItems}
          followUpNoNewInfo={fixture.followUpNoNewInfo}
          onStartFollowUp={noop}
          onApply={noop}
          onReRecord={noop}
          preview={recordingPreview}
        />
      );
    case "analyzing":
      return <VoiceAnalyzingStage isFollowUp={false} />;
    case "analyzing_follow_up":
      return <VoiceAnalyzingStage isFollowUp />;
    case "error":
      return <VoiceErrorStage errorCode={errorCode} onRetry={noop} />;
    default:
      return null;
  }
}

function VoiceIntakePreviewShell({
  phase,
  children,
  mobileViewport,
}: {
  phase: VoiceIntakePreviewPhase;
  children: React.ReactNode;
  mobileViewport: boolean;
}) {
  const isTriggerOnly = phase === "trigger" || phase === "footer_trigger";
  const isRecordingScreen =
    phase === "recording_initial" || phase === "recording_follow_up";
  const usesPortalViewport = !isTriggerOnly && !isRecordingScreen;
  const fitMobileContent = mobileViewport && usesPortalViewport;

  return (
    <div
      className={cn(
        "relative mx-auto flex flex-col rounded-2xl border border-border/60 bg-background shadow-lg",
        mobileViewport ? "w-full max-w-[24rem]" : "w-full max-w-3xl",
        isTriggerOnly && "min-h-[12rem] items-center justify-center p-6",
        isRecordingScreen && "py-6",
        usesPortalViewport && !fitMobileContent && "min-h-[32rem] overflow-hidden",
      )}
      style={usesPortalViewport && !fitMobileContent ? { height: "min(80vh, 44rem)" } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />

      {!isTriggerOnly ? (
        <button
          type="button"
          className="absolute top-3 right-3 z-20 inline-flex size-10 items-center justify-center rounded-full border border-border/45 bg-background/55 text-muted-foreground shadow-md backdrop-blur-md"
          aria-hidden
          tabIndex={-1}
        >
          <X className="size-5" />
        </button>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex w-full flex-col",
          isRecordingScreen && "items-center px-4 py-2 pt-3",
          !isTriggerOnly &&
            !isRecordingScreen &&
            "pt-12",
          usesPortalViewport && !fitMobileContent && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <div
          className={cn(
            "w-full",
            usesPortalViewport &&
              !fitMobileContent &&
              "flex min-h-0 flex-1 flex-col overflow-hidden",
            fitMobileContent && "flex flex-col",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function AdminVoiceIntakePreviewPanel({ pageLocale }: { pageLocale: Locale }) {
  const t = useTranslations("admin.voiceIntakePreview");

  const [previewLocale, setPreviewLocale] = useState<Locale>(pageLocale);
  const [phase, setPhase] = useState<VoiceIntakePreviewPhase>("summary");
  const [scenarioId, setScenarioId] = useState<VoiceIntakePreviewScenarioId>("rich");
  const [errorCode, setErrorCode] = useState<VoiceIntakeErrorCode>("mic_denied");
  const [mobileViewport, setMobileViewport] = useState(false);
  const [forceDark, setForceDark] = useState(false);
  const [recordingLevel, setRecordingLevel] = useState(0.55);
  const [recordingDurationMs, setRecordingDurationMs] = useState(12_000);
  const [showAddedItems, setShowAddedItems] = useState(false);
  const [addedItemsSeed, setAddedItemsSeed] = useState(0);

  const fixture = useMemo(
    () => buildVoiceIntakePreviewFixture(scenarioId, previewLocale),
    [scenarioId, previewLocale],
  );

  const recordingPreview: VoiceRecordingPreviewState = useMemo(
    () => ({
      level: recordingLevel,
      durationMs: recordingDurationMs,
      active: true,
      isRecording: true,
    }),
    [recordingLevel, recordingDurationMs],
  );

  const previewMessages = useMemo(() => getMessagesForLocale(previewLocale), [previewLocale]);

  const followUpResolvedItems = useMemo(() => {
    if (!showAddedItems) {
      return fixture.followUpResolvedItems;
    }
    void addedItemsSeed;
    return pickRandomPreviewResolvedItems(previewLocale, 3);
  }, [showAddedItems, addedItemsSeed, previewLocale, fixture.followUpResolvedItems]);

  const showRecordingControls =
    phase === "recording_initial" || phase === "recording_follow_up";

  const durationPresets =
    phase === "recording_follow_up"
      ? [
          { label: t("duration12s"), ms: 12_000 },
          { label: t("duration45s"), ms: 45_000 },
          { label: t("duration55s"), ms: 55_000 },
        ]
      : [
          { label: t("duration2s"), ms: 2_400 },
          { label: t("duration90s"), ms: 90_000 },
          { label: t("duration150s"), ms: 150_000 },
        ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/60 bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="voice-preview-phase">{t("phase")}</Label>
          <select
            id="voice-preview-phase"
            className="flex h-9 min-w-[12rem] rounded-md border border-input bg-background px-3 text-sm"
            value={phase}
            onChange={(event) => setPhase(event.target.value as VoiceIntakePreviewPhase)}
          >
            {VOICE_INTAKE_PREVIEW_PHASES.map((item) => (
              <option key={item} value={item}>
                {t(`phases.${item}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice-preview-scenario">{t("scenario")}</Label>
          <select
            id="voice-preview-scenario"
            className="flex h-9 min-w-[10rem] rounded-md border border-input bg-background px-3 text-sm"
            value={scenarioId}
            onChange={(event) => setScenarioId(event.target.value as VoiceIntakePreviewScenarioId)}
          >
            {VOICE_INTAKE_PREVIEW_SCENARIOS.map((item) => (
              <option key={item} value={item}>
                {t(`scenarios.${item}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice-preview-locale">{t("locale")}</Label>
          <select
            id="voice-preview-locale"
            className="flex h-9 w-28 rounded-md border border-input bg-background px-3 text-sm"
            value={previewLocale}
            onChange={(event) => setPreviewLocale(event.target.value as Locale)}
          >
            <option value="pl">PL</option>
            <option value="en">EN</option>
          </select>
        </div>

        {phase === "error" ? (
          <div className="space-y-2">
            <Label htmlFor="voice-preview-error">{t("errorCode")}</Label>
            <select
              id="voice-preview-error"
              className="flex h-9 min-w-[12rem] rounded-md border border-input bg-background px-3 text-sm"
              value={errorCode}
              onChange={(event) => setErrorCode(event.target.value as VoiceIntakeErrorCode)}
            >
              {VOICE_INTAKE_PREVIEW_ERROR_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <label className="flex items-center gap-2 pb-2 text-sm">
          <Checkbox
            checked={mobileViewport}
            onCheckedChange={(checked) => setMobileViewport(checked === true)}
          />
          {t("mobileViewport")}
        </label>

        <label className="flex items-center gap-2 pb-2 text-sm">
          <Checkbox
            checked={forceDark}
            onCheckedChange={(checked) => setForceDark(checked === true)}
          />
          {t("forceDark")}
        </label>

        {phase === "summary" ? (
          <label className="flex items-center gap-2 pb-2 text-sm">
            <Checkbox
              checked={showAddedItems}
              onCheckedChange={(checked) => {
                const enabled = checked === true;
                setShowAddedItems(enabled);
                if (enabled) {
                  setAddedItemsSeed((current) => current + 1);
                }
              }}
            />
            {t("showAdded")}
          </label>
        ) : null}
      </div>

      {showRecordingControls ? (
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/60 bg-card p-4">
          <div className="min-w-[12rem] flex-1 space-y-2">
            <Label htmlFor="voice-preview-level">
              {t("waveLevel")} ({Math.round(recordingLevel * 100)}%)
            </Label>
            <input
              id="voice-preview-level"
              type="range"
              min={0}
              max={100}
              value={Math.round(recordingLevel * 100)}
              onChange={(event) => setRecordingLevel(Number(event.target.value) / 100)}
              className="w-full"
            />
          </div>

          <div className="min-w-[12rem] flex-1 space-y-2">
            <Label htmlFor="voice-preview-duration">{t("timerMs")}</Label>
            <input
              id="voice-preview-duration"
              type="number"
              min={0}
              step={1000}
              value={recordingDurationMs}
              onChange={(event) => setRecordingDurationMs(Number(event.target.value) || 0)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 pb-0.5">
            {durationPresets.map((preset) => (
              <Button
                key={preset.ms}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRecordingDurationMs(preset.ms)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={cn(forceDark && "dark")}>
        <NextIntlClientProvider locale={previewLocale} messages={previewMessages}>
          <VoiceIntakePreviewShell phase={phase} mobileViewport={mobileViewport}>
            <VoiceIntakePreviewStage
              phase={phase}
              fixture={fixture}
              followUpResolvedItems={followUpResolvedItems}
              recordingPreview={recordingPreview}
              errorCode={errorCode}
            />
          </VoiceIntakePreviewShell>
        </NextIntlClientProvider>
      </div>
    </div>
  );
}
