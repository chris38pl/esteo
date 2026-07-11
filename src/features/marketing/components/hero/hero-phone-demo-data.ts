import type { LineItemData } from "@/features/estimates/components/estimate-line-item-row";
import type { Locale } from "@/lib/locale";

/** Marketing phone demo - phase indices (see heroPhonePhaseDurationsMs). */
export const HERO_PHONE_PHASE = {
  FORM_IDLE: 0,
  FORM_TYPING: 1,
  FORM_SUBMIT: 2,
  FORM_TRANSITION: 3,
  GENERATING: 4,
  ESTIMATE_IDLE: 5,
  SECTION_EXPAND: 6,
  ESTIMATE_HOLD: 7,
  ASSISTANT_INPUT_TYPING: 8,
  ASSISTANT_SEND_CLICK: 9,
  ASSISTANT_USER_SENT: 10,
  ASSISTANT_THINKING: 11,
  ASSISTANT_AI_TYPING: 12,
  ASSISTANT_AI_DONE: 13,
  SHEET_OPEN: 14,
  SHEET_EDIT: 15,
  SHEET_SAVE: 16,
  TOTALS_COUNTUP: 17,
  MORE_MENU_OPEN: 18,
  SAVE_PDF_CLICK: 19,
  TOAST_LOADING: 20,
  TOAST_SUCCESS: 21,
  SUCCESS_HOLD: 22,
} as const;

export const HERO_PHONE_PHASE_COUNT = 23;

export const heroPhonePhaseDurationsMs = [
  900, // form idle
  4500, // typing
  1400, // submit highlight
  700, // transition
  2800, // AI generating skeleton
  2000, // estimate collapsed
  1400, // section expand
  500, // pause after section expand, then assistant input typing
  3000, // assistant input typing
  550, // send click
  400, // user message appears
  2000, // AI thinking
  2800, // AI response typing + sheet opens
  600, // AI response hold (sheet visible)
  2200, // sheet edit - name + price typing animation
  0, // skip hold - go straight to saving
  1400, // sheet save
  3400, // totals count-up
  650, // more menu open (3 dots)
  550, // save pdf click
  3600, // toast loading (generating pdf)
  4000, // toast success
  1800, // success hold before cycle
] as const;

const heroPhoneMobilePhaseDurationsMs: Partial<Record<number, number>> = {
  [HERO_PHONE_PHASE.ASSISTANT_INPUT_TYPING]: 350,
  [HERO_PHONE_PHASE.ASSISTANT_SEND_CLICK]: 0,
  [HERO_PHONE_PHASE.ASSISTANT_USER_SENT]: 0,
  [HERO_PHONE_PHASE.ASSISTANT_THINKING]: 1400,
  [HERO_PHONE_PHASE.ASSISTANT_AI_TYPING]: 1500,
  [HERO_PHONE_PHASE.ASSISTANT_AI_DONE]: 1000,
};

export function getHeroPhonePhaseDuration(phase: number, isMobile: boolean): number {
  if (isMobile && heroPhoneMobilePhaseDurationsMs[phase] !== undefined) {
    return heroPhoneMobilePhaseDurationsMs[phase] as number;
  }

  return heroPhonePhaseDurationsMs[phase] ?? 2000;
}

export function isHeroAssistantModalOpen(phase: number, isMobile: boolean) {
  if (!isMobile) {
    return false;
  }

  return (
    phase >= HERO_PHONE_PHASE.ASSISTANT_INPUT_TYPING && phase <= HERO_PHONE_PHASE.ASSISTANT_AI_DONE
  );
}

export function isHeroSheetOpen(phase: number, isMobile = false) {
  if (isMobile) {
    return phase >= HERO_PHONE_PHASE.SHEET_OPEN && phase <= HERO_PHONE_PHASE.SHEET_SAVE;
  }

  return phase >= HERO_PHONE_PHASE.ASSISTANT_AI_TYPING && phase <= HERO_PHONE_PHASE.SHEET_SAVE;
}

export function isHeroEstimateEdited(phase: number) {
  return phase >= HERO_PHONE_PHASE.TOTALS_COUNTUP;
}

export function getHeroRequestDescription(locale: Locale): string {
  return locale === "pl"
    ? "Remont łazienki 8 m², prysznic walk-in, oświetlenie LED, gres na podłodze i ścianach."
    : "Bathroom renovation 8 m², walk-in shower, LED lighting, floor and wall tiles.";
}

export function getHeroRequestAddress(locale: Locale): string {
  return locale === "pl"
    ? "ul. Kwiatowa 15, 00-001 Warszawa"
    : "15 Blossom St, London SW1A 1AA";
}

export function getHeroRequestClientName(locale: Locale): string {
  return locale === "pl" ? "Jan Nowak" : "John Smith";
}

export function getHeroRequestAttachment(locale: Locale): { name: string; sizeLabel: string } {
  return locale === "pl"
    ? { name: "plan-lazienki.pdf", sizeLabel: "842 KB" }
    : { name: "bathroom-plan.pdf", sizeLabel: "842 KB" };
}

function item(
  id: string,
  name: string,
  unit: string,
  quantity: number,
  unitPrice: number,
  sortOrder: number,
): LineItemData {
  return {
    id,
    name,
    unit,
    quantity,
    baseUnitPrice: unitPrice,
    unitPrice,
    vatRate: 0.23,
    sortOrder,
  };
}

export function getHeroEstimateSections(locale: Locale): Array<{
  id: string;
  title: string;
  items: LineItemData[];
}> {
  const isPl = locale === "pl";

  return [
    {
      id: "demolition",
      title: isPl ? "Demontaż" : "Demolition",
      items: [
        item(
          "item-1",
          isPl ? "Usunięcie starej glazury" : "Remove old wall tiles",
          "m²",
          12,
          45,
          0,
        ),
        item(
          "item-2",
          isPl ? "Demontaż armatury i ceramiki" : "Remove fixtures and sanitary ware",
          "kpl.",
          1,
          520,
          1,
        ),
      ],
    },
    {
      id: "plumbing",
      title: isPl ? "Hydraulika" : "Plumbing",
      items: [
        item(
          "item-shower",
          isPl ? "Montaż prysznica" : "Shower installation",
          "kpl.",
          1,
          2400,
          0,
        ),
        item(
          "item-4",
          isPl ? "Montaż odpływu" : "Drain installation",
          "kpl.",
          1,
          980,
          1,
        ),
        item(
          "item-plumbing-retrofit",
          isPl
            ? "Przeróbka instalacji wodnej i kanalizacyjnej"
            : "Water and sewer line modifications",
          "kpl.",
          1,
          1580,
          2,
        ),
      ],
    },
    {
      id: "finishing",
      title: isPl ? "Wykończenie" : "Finishing",
      items: [
        item(
          "item-5",
          isPl ? "Układanie płytek gresowych" : "Porcelain tile installation",
          "m²",
          18,
          280,
          0,
        ),
        item(
          "item-6",
          isPl ? "System hydroizolacji" : "Waterproofing system",
          "m²",
          12,
          95,
          1,
        ),
        item(
          "item-6b",
          isPl ? "Fugowanie, silikonowanie i wykończenie detali" : "Grouting, sealing and detail finishing",
          "kpl.",
          1,
          8200,
          2,
        ),
      ],
    },
    {
      id: "electrical",
      title: isPl ? "Instalacje elektryczne" : "Electrical",
      items: [
        item(
          "item-7",
          isPl ? "Oświetlenie LED w suficie podwieszanym" : "LED lighting in suspended ceiling",
          "kpl.",
          1,
          540,
          0,
        ),
        item(
          "item-8",
          isPl ? "Punkt elektryczny osprzętu" : "Fixture electrical point",
          isPl ? "szt." : "pcs",
          3,
          180,
          1,
        ),
      ],
    },
  ];
}

export const HERO_EDIT_ITEM_ID = "item-shower";
export const HERO_EXPAND_SECTION_ID = "plumbing";

export function getHeroEditedItemNames(locale: Locale) {
  return locale === "pl"
    ? { original: "Montaż prysznica", edited: "Montaż wanny" }
    : { original: "Shower installation", edited: "Bathtub installation" };
}

export function getHeroEditedItemValues(phase: number, locale: Locale) {
  const showEdited =
    (phase >= HERO_PHONE_PHASE.SHEET_OPEN && phase <= HERO_PHONE_PHASE.SHEET_SAVE) ||
    phase >= HERO_PHONE_PHASE.TOTALS_COUNTUP;

  const names = getHeroEditedItemNames(locale);

  return {
    editedName: names.edited,
    quantity: 1,
    unitPrice: showEdited ? 3200 : 2400,
  };
}
