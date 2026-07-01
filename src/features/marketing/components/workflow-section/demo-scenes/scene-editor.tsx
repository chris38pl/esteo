"use client";

import { useMemo } from "react";

import "@/features/estimates/styles/estimate-editor-layout.css";

import { heroAnimationContent } from "@/features/marketing/components/hero/hero-animation-data";
import { HeroPhoneAssistantModal } from "@/features/marketing/components/hero/hero-phone-assistant-modal";
import {
  getHeroEditedItemValues,
  getHeroEstimateSections,
  HERO_EDIT_ITEM_ID,
  HERO_PHONE_PHASE,
} from "@/features/marketing/components/hero/hero-phone-demo-data";
import { HeroPhoneInlinePositionSheet } from "@/features/marketing/components/hero/hero-phone-inline-position-sheet";
import {
  WORKFLOW_EXPAND_SECTION_ID,
  WorkflowEstimatePreview,
} from "@/features/marketing/components/workflow-section/demo-scenes/workflow-estimate-preview";
import { useSceneLoop } from "@/features/marketing/components/workflow-section/interactive-demo/use-scene-loop";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

/** estimate → AI modal → sheet edit → send → PDF toast */
const EDITOR_PHASE_DURATIONS = [
  1000, 900, 2000, 2800, 2400, 1400, 1800, 700, 3600, 4000,
] as const;

const WORKFLOW_EDITOR_HERO_PHASES = [
  HERO_PHONE_PHASE.SECTION_EXPAND,
  HERO_PHONE_PHASE.ASSISTANT_USER_SENT,
  HERO_PHONE_PHASE.ASSISTANT_THINKING,
  HERO_PHONE_PHASE.ASSISTANT_AI_TYPING,
  HERO_PHONE_PHASE.SHEET_EDIT,
  HERO_PHONE_PHASE.SHEET_SAVE,
  HERO_PHONE_PHASE.TOTALS_COUNTUP,
  HERO_PHONE_PHASE.TOTALS_COUNTUP,
  HERO_PHONE_PHASE.TOAST_LOADING,
  HERO_PHONE_PHASE.TOAST_SUCCESS,
] as const;

export function SceneEditor({
  locale,
  reducedMotion,
}: {
  locale: Locale;
  reducedMotion: boolean | null;
}) {
  const workflowPhase = useSceneLoop(10, EDITOR_PHASE_DURATIONS, {
    reducedMotion,
    cyclePauseMs: 900,
  });

  const heroPhase =
    WORKFLOW_EDITOR_HERO_PHASES[
      reducedMotion ? WORKFLOW_EDITOR_HERO_PHASES.length - 1 : workflowPhase
    ] ?? HERO_PHONE_PHASE.TOAST_SUCCESS;

  const sections = useMemo(() => getHeroEstimateSections(locale), [locale]);
  const sheetItem =
    sections.flatMap((section) => section.items).find((item) => item.id === HERO_EDIT_ITEM_ID) ??
    null;
  const editedValues = getHeroEditedItemValues(heroPhase, locale);
  const assistant = heroAnimationContent[locale].assistant;

  const assistantModalOpen =
    !reducedMotion && workflowPhase >= 1 && workflowPhase <= 3;
  const sheetOpen = !reducedMotion && workflowPhase >= 4 && workflowPhase <= 5;
  const highlightedItemId =
    workflowPhase >= 4 || reducedMotion ? HERO_EDIT_ITEM_ID : null;

  const sendHighlighted = !reducedMotion && workflowPhase === 7;
  const toastVariant =
    heroPhase === HERO_PHONE_PHASE.TOAST_LOADING
      ? "loading"
      : heroPhase >= HERO_PHONE_PHASE.TOAST_SUCCESS
        ? "success"
        : null;
  const statusKey =
    heroPhase >= HERO_PHONE_PHASE.TOAST_SUCCESS ? "SENT" : "DRAFT";

  return (
    <div className={cn("relative h-full min-h-0", sheetOpen ? "overflow-visible" : "overflow-hidden")}>
      <WorkflowEstimatePreview
        marketingLocale={locale}
        expandedSectionId={WORKFLOW_EXPAND_SECTION_ID}
        highlightedItemId={highlightedItemId}
        heroPhase={heroPhase}
        statusKey={statusKey}
        toastVariant={toastVariant}
        sendHighlighted={sendHighlighted}
      />

      <HeroPhoneAssistantModal
        open={assistantModalOpen}
        phase={heroPhase}
        assistant={assistant}
        layout="corner"
      />

      <HeroPhoneInlinePositionSheet
        open={sheetOpen}
        item={sheetItem}
        positionLabel="2.1"
        quantity={editedValues.quantity}
        unitPrice={editedValues.unitPrice}
        itemName={editedValues.editedName}
        editing={heroPhase >= HERO_PHONE_PHASE.SHEET_EDIT && heroPhase < HERO_PHONE_PHASE.SHEET_SAVE}
        saving={heroPhase === HERO_PHONE_PHASE.SHEET_SAVE}
        surface="workflow"
      />
    </div>
  );
}
