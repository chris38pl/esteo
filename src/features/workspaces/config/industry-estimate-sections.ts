import { WorkspaceIndustry } from "@prisma/client";

export type LocalizedSectionText = {
  pl: string;
  en: string;
};

export type IndustryEstimateSectionDefinition = {
  key: string;
  title: LocalizedSectionText;
  defaultRule: LocalizedSectionText;
};

export const INDUSTRY_ESTIMATE_SECTION_TEMPLATES: Record<
  Exclude<WorkspaceIndustry, "OTHER">,
  IndustryEstimateSectionDefinition[]
> = {
  [WorkspaceIndustry.CONSTRUCTION]: [
    {
      key: "demolition",
      title: { pl: "Prace rozbiórkowe", en: "Demolition" },
      defaultRule: {
        pl: "Uwzględnij utylizację gruzu, zabezpieczenie sąsiednich pomieszczeń i demontaż bez uszkodzeń konstrukcji.",
        en: "Include debris disposal, protection of adjacent areas, and dismantling without structural damage.",
      },
    },
    {
      key: "installations",
      title: { pl: "Instalacje", en: "Installations" },
      defaultRule: {
        pl: "Rozdziel instalacje elektryczne, wod-kan. i HVAC, jeśli wynikają z zakresu; podaj materiały i robociznę osobno.",
        en: "Split electrical, plumbing, and HVAC when in scope; list materials and labor separately.",
      },
    },
    {
      key: "finishes",
      title: { pl: "Prace wykończeniowe", en: "Finishing works" },
      defaultRule: {
        pl: "Obejmuj tynki, gładzie, malowanie i posadzki zgodnie z zakresem; podaj jednostki m² lub mb.",
        en: "Cover plaster, skim coats, painting, and flooring per scope; use m² or linear m units.",
      },
    },
    {
      key: "kitchen",
      title: { pl: "Kuchnia", en: "Kitchen" },
      defaultRule: {
        pl: "Uwzględnij zabudowę, blat, okap, podłączenia AGD oraz wykończenie ścian w strefie kuchni.",
        en: "Include cabinetry, countertop, hood, appliance connections, and wall finishes in the kitchen zone.",
      },
    },
    {
      key: "bathroom",
      title: { pl: "Łazienka", en: "Bathroom" },
      defaultRule: {
        pl: "Uwzględnij hydroizolację, płytki, armaturę sanitarą i wentylację w strefie mokrej.",
        en: "Include waterproofing, tiling, sanitary fixtures, and ventilation in wet areas.",
      },
    },
    {
      key: "fixtures",
      title: { pl: "Montaż wyposażenia", en: "Fixtures installation" },
      defaultRule: {
        pl: "Montaż drzwi, oświetlenia, karniszy i osprzętu po zakończeniu prac mokrych i malowania.",
        en: "Install doors, lighting, fixtures, and hardware after wet works and painting are complete.",
      },
    },
  ],
  [WorkspaceIndustry.ELECTRICAL]: [
    {
      key: "preparation",
      title: { pl: "Przygotowanie i trasy", en: "Preparation and routing" },
      defaultRule: {
        pl: "Uwzględnij bruzdowanie, przepusty, puszki i zabezpieczenie przed pracami budowlanyi.",
        en: "Include chasing, penetrations, boxes, and protection before build-out finishes.",
      },
    },
    {
      key: "distribution",
      title: { pl: "Rozdzielnia i zabezpieczenia", en: "Distribution and protection" },
      defaultRule: {
        pl: "Podaj rozdzielnicę, wyłączniki różnicowoprądowe i dobór zabezpieczeń zgodnie z obciążeniem.",
        en: "List panel, RCDs, and breaker sizing according to calculated load.",
      },
    },
    {
      key: "circuits",
      title: { pl: "Obwody i punkty", en: "Circuits and outlets" },
      defaultRule: {
        pl: "Rozpis obwody gniazd, oświetlenia i sterowania z przewodami i osprzętem.",
        en: "Break out socket, lighting, and control circuits with cabling and devices.",
      },
    },
    {
      key: "commissioning",
      title: { pl: "Pomiary i odbiór", en: "Testing and commissioning" },
      defaultRule: {
        pl: "Uwzględnij pomiary, protokoły i uruchomienie instalacji po montażu.",
        en: "Include measurements, test reports, and energization after installation.",
      },
    },
    {
      key: "materials",
      title: { pl: "Materiały", en: "Materials" },
      defaultRule: {
        pl: "Wydziel materiały elektryczne osobno od robocizny, z marką lub klasą jakości jeśli znana.",
        en: "Separate electrical materials from labor; note brand or quality class when known.",
      },
    },
  ],
  [WorkspaceIndustry.PLUMBING]: [
    {
      key: "preparation",
      title: { pl: "Przygotowanie i przebicia", en: "Preparation and penetrations" },
      defaultRule: {
        pl: "Uwzględnij przebicia, podcięcia i przygotowanie pod instalacje podtynkowe.",
        en: "Include core drilling, chases, and prep for concealed installations.",
      },
    },
    {
      key: "rough_in",
      title: { pl: "Instalacje wod-kan.", en: "Rough-in plumbing" },
      defaultRule: {
        pl: "Rozdziel zimna/ciepła woda, kanalizację i odpływy z rurami i izolacją.",
        en: "Split cold/hot water, drainage, and wastes with piping and insulation.",
      },
    },
    {
      key: "fixtures",
      title: { pl: "Armatura i podłączenia", en: "Fixtures and connections" },
      defaultRule: {
        pl: "Montaż baterii, WC, brodzików/wann i podłączeń sprzętu zgodnie z projektem.",
        en: "Install faucets, WC, trays/tubs, and appliance connections per design.",
      },
    },
    {
      key: "testing",
      title: { pl: "Próby szczelności", en: "Pressure testing" },
      defaultRule: {
        pl: "Uwzględnij próby ciśnieniowe i odbiór instalacji przed zabudową.",
        en: "Include pressure tests and sign-off before concealment.",
      },
    },
    {
      key: "materials",
      title: { pl: "Materiały", en: "Materials" },
      defaultRule: {
        pl: "Materiały hydrauliczne osobno od robocizny; podaj średnice i typ rur jeśli znane.",
        en: "Plumbing materials separate from labor; note diameters and pipe types when known.",
      },
    },
  ],
  [WorkspaceIndustry.CARPENTRY]: [
    {
      key: "design",
      title: { pl: "Projekt i pomiary", en: "Design and surveying" },
      defaultRule: {
        pl: "Pomiar, inwentaryzacja, projekt 2D/3D, wizualizacje i dokumentacja produkcyjna.",
        en: "Surveying, inventory, 2D/3D design, visualizations, and production documentation.",
      },
    },
    {
      key: "materials",
      title: { pl: "Materiały i komponenty", en: "Materials and components" },
      defaultRule: {
        pl: "Korpusy, fronty, blaty, okucia, szkło, LED — zgodnie z poziomem budżetu i Company Context.",
        en: "Carcasses, fronts, worktops, hardware, glass, LED — per budget tier and Company Context.",
      },
    },
    {
      key: "fittings",
      title: { pl: "Wyposażenie dodatkowe", en: "Additional fittings" },
      defaultRule: {
        pl: "Cargo, organizery, montaż AGD, wyposażenie szaf i garderób.",
        en: "Cargo systems, organizers, appliance installation, wardrobe interior fittings.",
      },
    },
    {
      key: "production",
      title: { pl: "Produkcja", en: "Production" },
      defaultRule: {
        pl: "Rozkrój, okleinowanie, CNC, lakierowanie, kontrola jakości.",
        en: "Cutting, edging, CNC, lacquering, quality control.",
      },
    },
    {
      key: "transport",
      title: { pl: "Transport", en: "Transport" },
      defaultRule: {
        pl: "Transport, wniesienie, zabezpieczenie i magazynowanie.",
        en: "Delivery, carrying in, protection, and storage.",
      },
    },
    {
      key: "installation",
      title: { pl: "Montaż", en: "Installation" },
      defaultRule: {
        pl: "Montaż korpusów, frontów i blatów, regulacja, odbiór.",
        en: "Install carcasses, fronts, and worktops; adjustment and handover.",
      },
    },
  ],
};

export function hasIndustrySectionDefaults(industry: WorkspaceIndustry): boolean {
  return industry !== WorkspaceIndustry.OTHER;
}

export function getIndustryEstimateSectionTemplate(
  industry: WorkspaceIndustry,
): IndustryEstimateSectionDefinition[] | null {
  if (industry === WorkspaceIndustry.OTHER) {
    return null;
  }
  return INDUSTRY_ESTIMATE_SECTION_TEMPLATES[industry];
}
