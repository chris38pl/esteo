"use client";



import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";



import "@/features/estimates/styles/estimate-editor-layout.css";

import { HeroPhoneAppSurface } from "@/features/marketing/components/hero/hero-phone-app-surface";
import { heroAnimationContent } from "@/features/marketing/components/hero/hero-animation-data";

import {
  getHeroEditedItemValues,
  getHeroEstimateSections,
  getHeroRequestAddress,
  getHeroRequestAttachment,
  getHeroRequestClientName,
  getHeroRequestDescription,
  HERO_EDIT_ITEM_ID,
  HERO_EXPAND_SECTION_ID,
  HERO_PHONE_PHASE,
  isHeroAssistantModalOpen,
  isHeroSheetOpen,
} from "@/features/marketing/components/hero/hero-phone-demo-data";

import { HeroPhoneEstimateScreen } from "@/features/marketing/components/hero/hero-phone-estimate-screen";
import { HeroPhoneAssistantModal } from "@/features/marketing/components/hero/hero-phone-assistant-modal";

import { HeroPhoneGeneratingScreen } from "@/features/marketing/components/hero/hero-phone-generating-screen";

import { HeroPhoneRequestScreen } from "@/features/marketing/components/hero/hero-phone-request-screen";

import type { Locale } from "@/lib/locale";



export function HeroPhoneScene({
  phase,
  locale,
  isMobile,
}: {
  phase: number;
  locale: Locale;
  isMobile: boolean;
}) {

  const fullDescription = useMemo(() => getHeroRequestDescription(locale), [locale]);

  const address = useMemo(() => getHeroRequestAddress(locale), [locale]);
  const clientName = useMemo(() => getHeroRequestClientName(locale), [locale]);

  const attachment = useMemo(() => getHeroRequestAttachment(locale), [locale]);

  const sections = useMemo(() => getHeroEstimateSections(locale), [locale]);
  const estimateTitle = heroAnimationContent[locale].estimateTitle;

  const [typingSlice, setTypingSlice] = useState("");



  const isFormPhase = phase <= 3;

  const isTransition = phase === 3;

  const isGeneratingPhase = phase === 4;

  const isEstimatePhase = phase >= 5;

  const description =

    phase <= 0 ? "" : phase === 1 ? typingSlice : fullDescription;



  const expandedSectionId = phase >= HERO_PHONE_PHASE.SECTION_EXPAND ? HERO_EXPAND_SECTION_ID : null;

  const highlightedItemId =
    phase >= (isMobile ? HERO_PHONE_PHASE.SHEET_OPEN : HERO_PHONE_PHASE.ASSISTANT_AI_TYPING)
      ? HERO_EDIT_ITEM_ID
      : null;

  const sheetOpen = isHeroSheetOpen(phase, isMobile);
  const assistantModalOpen = isHeroAssistantModalOpen(phase, isMobile);

  const editedValues = getHeroEditedItemValues(phase, locale);

  const sheetItem = sections.flatMap((s) => s.items).find((item) => item.id === HERO_EDIT_ITEM_ID) ?? null;

  const sheetPositionLabel = "2.1";



  useEffect(() => {

    if (phase !== 1) {

      return;

    }



    let index = 0;

    const interval = window.setInterval(() => {

      index += 1;

      setTypingSlice(fullDescription.slice(0, index));

      if (index >= fullDescription.length) {

        window.clearInterval(interval);

      }

    }, 38);



    return () => window.clearInterval(interval);

  }, [phase, fullDescription]);



  return (

    <HeroPhoneAppSurface className="relative">

      <AnimatePresence mode="wait">

        {isFormPhase ? (

          <motion.div

            key="request"

            initial={{ opacity: 0 }}

            animate={{ opacity: isTransition ? 0 : 1, x: isTransition ? -12 : 0 }}

            exit={{ opacity: 0, x: -12 }}

            transition={{ duration: 0.35 }}

            className="absolute inset-0"

          >

            <HeroPhoneRequestScreen

              clientName={clientName}

              address={address}

              description={description}

              attachment={attachment}

              submitHighlighted={phase === 2}

              isSubmitting={phase === 3}

            />

          </motion.div>

        ) : null}



        {isGeneratingPhase ? (

          <motion.div

            key="generating"

            initial={{ opacity: 0, x: 12 }}

            animate={{ opacity: 1, x: 0 }}

            exit={{ opacity: 0, x: -8 }}

            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}

            className="absolute inset-0"

          >

            <HeroPhoneGeneratingScreen />

          </motion.div>

        ) : null}



        {isEstimatePhase ? (

          <motion.div

            key="estimate"

            initial={{ opacity: 0, x: 16 }}

            animate={{ opacity: 1, x: 0 }}

            exit={{ opacity: 0 }}

            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}

            className="absolute inset-0"

          >

            <HeroPhoneEstimateScreen

              title={estimateTitle}

              sections={sections}

              phase={phase}

              expandedSectionId={expandedSectionId}

              highlightedItemId={highlightedItemId}

              sheetOpen={sheetOpen}

              sheetItem={sheetItem}

              sheetPositionLabel={sheetPositionLabel}

              sheetQuantity={editedValues.quantity}

              sheetUnitPrice={editedValues.unitPrice}

              sheetItemName={editedValues.editedName}

              toastVariant={
                phase === HERO_PHONE_PHASE.TOAST_LOADING
                  ? "loading"
                  : phase >= HERO_PHONE_PHASE.TOAST_SUCCESS
                    ? "success"
                    : null
              }

            />

          </motion.div>

        ) : null}

      </AnimatePresence>

      <HeroPhoneAssistantModal
        open={assistantModalOpen}
        phase={phase}
        assistant={heroAnimationContent[locale].assistant}
      />

    </HeroPhoneAppSurface>

  );

}

