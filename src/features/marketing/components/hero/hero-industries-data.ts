import type { Locale } from "@/lib/locale";

export type HeroIndustryCard = {
  id: string;
  title: string;
  items: string[];
  imageSrc: string;
  imageFallbackSrc: string;
  imageAlt: string;
};

const INDUSTRY_IMAGE_BASE = "/images/marketing/industries";
const ESTIMATE_HERO = "/images/estimate-request";

function industryImages(slug: string, fallback: string) {
  return {
    imageSrc: `${INDUSTRY_IMAGE_BASE}/${slug}.webp`,
    imageFallbackSrc: fallback,
  };
}

const heroIndustriesPl: HeroIndustryCard[] = [
  {
    id: "construction",
    title: "Budownictwo",
    items: [
      "Generalni wykonawcy",
      "firmy budowlane",
      "inwestycje mieszkaniowe i komercyjne",
    ],
    ...industryImages("construction", `${ESTIMATE_HERO}/construction/hero-dark.webp`),
    imageAlt: "Budownictwo - plac budowy",
  },
  {
    id: "renovations",
    title: "Remonty i wykończenia",
    items: [
      "Firmy remontowe i wykończeniowe",
      "łazienki i kuchnie",
      "kompleksowe wykończenia mieszkań",
    ],
    ...industryImages("renovations", `${ESTIMATE_HERO}/carpentry/hero-dark.webp`),
    imageAlt: "Remonty i wykończenia wnętrz",
  },
  {
    id: "electrical",
    title: "Instalacje elektryczne",
    items: [
      "Elektrycy i firmy instalacyjne",
      "domy, biura i lokale usługowe",
      "hale magazynowe i obiekty przemysłowe",
    ],
    ...industryImages("electrical", `${ESTIMATE_HERO}/electrical/hero-dark.webp`),
    imageAlt: "Instalacje elektryczne",
  },
  {
    id: "plumbing",
    title: "Instalacje hydrauliczne",
    items: [
      "Instalacje wodno-kanalizacyjne",
      "centralne ogrzewanie i kotłownie",
      "pompy ciepła, ogrzewanie podłogowe i serwis",
    ],
    ...industryImages("plumbing", `${ESTIMATE_HERO}/construction/hero-dark.webp`),
    imageAlt: "Instalacje hydrauliczne",
  },
  {
    id: "events",
    title: "Eventy i produkcja",
    items: [
      "Organizatorzy wydarzeń i agencje eventowe",
      "sceny, nagłośnienie i oświetlenie",
      "produkcja koncertów, konferencji i eventów firmowych",
    ],
    ...industryImages("events", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Eventy i produkcja",
  },
  {
    id: "landscaping",
    title: "Ogrody i architektura krajobrazu",
    items: [
      "Ogrody przydomowe i zieleń osiedlowa",
      "nawierzchnie, tarasy i mała architektura",
      "systemy nawadniania i pielęgnacja terenów",
    ],
    ...industryImages("landscaping", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Ogrody i architektura krajobrazu",
  },
  {
    id: "hvac",
    title: "Klimatyzacja i HVAC",
    items: [
      "Montaż klimatyzacji split i VRF",
      "wentylacja mechaniczna i rekuperacja",
      "serwis, przeglądy i naprawy urządzeń",
    ],
    ...industryImages("hvac", `${ESTIMATE_HERO}/electrical/hero-dark.webp`),
    imageAlt: "Klimatyzacja i HVAC",
  },
  {
    id: "photovoltaics",
    title: "Fotowoltaika",
    items: [
      "Instalacje fotowoltaiczne dla domów i firm",
      "magazyny energii i systemy hybrydowe",
      "audyty, projekty i obsługa dotacji",
    ],
    ...industryImages("photovoltaics", `${ESTIMATE_HERO}/electrical/hero-dark.webp`),
    imageAlt: "Fotowoltaika",
  },
  {
    id: "heating-fireplaces",
    title: "Kominki i ogrzewanie",
    items: [
      "Kominki i piece kaflowe",
      "kotły gazowe, pelletowe i zasypowe",
      "instalacje grzewcze, serwis i przeglądy",
    ],
    ...industryImages("heating-fireplaces", `${ESTIMATE_HERO}/construction/hero-dark.webp`),
    imageAlt: "Kominki i ogrzewanie",
  },
  {
    id: "carpentry",
    title: "Stolarka",
    items: [
      "Meble i zabudowy na wymiar",
      "szafy, garderoby i zabudowy wnęk",
      "schody, balustrady i stolarka wykończeniowa",
    ],
    ...industryImages("carpentry", `${ESTIMATE_HERO}/carpentry/hero-dark.webp`),
    imageAlt: "Stolarka",
  },
  {
    id: "windows-doors",
    title: "Okna i drzwi",
    items: [
      "Wymiana okien i drzwi zewnętrznych",
      "stolarka PVC, drewniana i aluminiowa",
      "rolety, markizy i osłony przeciwsłoneczne",
    ],
    ...industryImages("windows-doors", `${ESTIMATE_HERO}/carpentry/hero-dark.webp`),
    imageAlt: "Okna i drzwi",
  },
  {
    id: "roofing",
    title: "Dachy",
    items: [
      "Naprawy i remonty pokryć dachowych",
      "blacha, dachówka i papy termozgrzewalne",
      "obróbki blacharskie, rynny i orynowanie",
    ],
    ...industryImages("roofing", `${ESTIMATE_HERO}/construction/hero-dark.webp`),
    imageAlt: "Dachy",
  },
  {
    id: "painting-facades",
    title: "Malowanie i elewacje",
    items: [
      "Malowanie wnętrz i renowacje lokali",
      "tynki, gładzie i zabudowy GK",
      "elewacje, ocieplenia i renowacje fasad",
    ],
    ...industryImages("painting-facades", `${ESTIMATE_HERO}/carpentry/hero-dark.webp`),
    imageAlt: "Malowanie i elewacje",
  },
  {
    id: "wedding-planning",
    title: "Organizacja wesel",
    items: [
      "Agencje ślubne i wedding plannerzy",
      "koordynacja ceremonii, wesela i harmonogramu",
      "dekoracje, dostawcy, logistyka i obsługa dnia ślubu",
    ],
    ...industryImages("wedding-planning", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Organizacja wesel",
  },
  {
    id: "floristry",
    title: "Florystyka",
    items: [
      "Kompozycje ślubne, okolicznościowe i eventowe",
      "bukiety, wianki i dekoracje sal",
      "dostawy kwiatów dla firm, hoteli i klientów prywatnych",
    ],
    ...industryImages("floristry", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Florystyka",
  },
  {
    id: "catering",
    title: "Catering",
    items: [
      "Catering konferencyjny, eventowy i weselny",
      "obsługa bankietów, przyjęć i eventów firmowych",
      "menu, logistyka, serwis na miejscu i wynajem sprzętu",
    ],
    ...industryImages("catering", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Catering",
  },
  {
    id: "photography",
    title: "Fotografia",
    items: [
      "Fotografia ślubna, biznesowa i produktowa",
      "sesje w studio, plenerze i na inwestycjach",
      "reportaże z eventów, sesje dla firm i marek",
    ],
    ...industryImages("photography", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Fotografia",
  },
  {
    id: "interior-design",
    title: "Projektowanie wnętrz",
    items: [
      "Projektowanie mieszkań, domów i przestrzeni biurowych",
      "koncepcje, wizualizacje i dobór materiałów wykończeniowych",
      "nadzór autorski, harmonogram prac i kosztorysy",
    ],
    ...industryImages("interior-design", `${ESTIMATE_HERO}/carpentry/hero-dark.webp`),
    imageAlt: "Projektowanie wnętrz",
  },
  {
    id: "cleaning",
    title: "Firmy sprzątające",
    items: [
      "Sprzątanie biur, lokali usługowych i obiektów komercyjnych",
      "sprzątanie po remoncie, deweloperskie i specjalistyczne",
      "usługi cykliczne, hotelowe oraz utrzymanie czystości obiektów",
    ],
    ...industryImages("cleaning", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Firmy sprzątające",
  },
];

const heroIndustriesEn: HeroIndustryCard[] = [
  {
    id: "construction",
    title: "Construction",
    items: [
      "General contractors",
      "building firms",
      "residential and commercial developments",
    ],
    ...industryImages("construction", `${ESTIMATE_HERO}/construction/hero-dark.webp`),
    imageAlt: "Construction site",
  },
  {
    id: "renovations",
    title: "Renovations and finishing",
    items: [
      "Renovation and fit-out contractors",
      "bathrooms and kitchens",
      "full apartment finishing projects",
    ],
    ...industryImages("renovations", `${ESTIMATE_HERO}/carpentry/hero-dark.webp`),
    imageAlt: "Interior renovations",
  },
  {
    id: "electrical",
    title: "Electrical installations",
    items: [
      "Electricians and installation firms",
      "homes, offices and retail spaces",
      "warehouses and industrial facilities",
    ],
    ...industryImages("electrical", `${ESTIMATE_HERO}/electrical/hero-dark.webp`),
    imageAlt: "Electrical work",
  },
  {
    id: "plumbing",
    title: "Plumbing installations",
    items: [
      "Water and sewer installations",
      "central heating and boiler rooms",
      "heat pumps, underfloor heating and service",
    ],
    ...industryImages("plumbing", `${ESTIMATE_HERO}/construction/hero-dark.webp`),
    imageAlt: "Plumbing installations",
  },
  {
    id: "events",
    title: "Events and production",
    items: [
      "Event organizers and production agencies",
      "stages, sound and lighting",
      "concerts, conferences and corporate events",
    ],
    ...industryImages("events", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Events and production",
  },
  {
    id: "landscaping",
    title: "Gardens and landscape",
    items: [
      "Residential gardens and estate greenery",
      "paving, terraces and outdoor structures",
      "irrigation systems and grounds maintenance",
    ],
    ...industryImages("landscaping", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Landscape architecture",
  },
  {
    id: "hvac",
    title: "Air conditioning and HVAC",
    items: [
      "Split and VRF air conditioning installation",
      "mechanical ventilation and heat recovery",
      "servicing, inspections and repairs",
    ],
    ...industryImages("hvac", `${ESTIMATE_HERO}/electrical/hero-dark.webp`),
    imageAlt: "HVAC systems",
  },
  {
    id: "photovoltaics",
    title: "Photovoltaics",
    items: [
      "PV systems for homes and businesses",
      "battery storage and hybrid systems",
      "audits, design and grant support",
    ],
    ...industryImages("photovoltaics", `${ESTIMATE_HERO}/electrical/hero-dark.webp`),
    imageAlt: "Solar panels",
  },
  {
    id: "heating-fireplaces",
    title: "Fireplaces and heating",
    items: [
      "Fireplaces and tiled stoves",
      "gas, pellet and solid-fuel boilers",
      "heating systems, service and inspections",
    ],
    ...industryImages("heating-fireplaces", `${ESTIMATE_HERO}/construction/hero-dark.webp`),
    imageAlt: "Fireplaces and heating",
  },
  {
    id: "carpentry",
    title: "Carpentry",
    items: [
      "Custom furniture and built-ins",
      "wardrobes, closets and alcove units",
      "stairs, railings and finishing carpentry",
    ],
    ...industryImages("carpentry", `${ESTIMATE_HERO}/carpentry/hero-dark.webp`),
    imageAlt: "Carpentry",
  },
  {
    id: "windows-doors",
    title: "Windows and doors",
    items: [
      "Window and exterior door replacement",
      "PVC, timber and aluminium joinery",
      "blinds, awnings and sun shading",
    ],
    ...industryImages("windows-doors", `${ESTIMATE_HERO}/carpentry/hero-dark.webp`),
    imageAlt: "Windows and doors",
  },
  {
    id: "roofing",
    title: "Roofing",
    items: [
      "Roof repairs and refurbishment",
      "metal sheets, tiles and membranes",
      "flashing, gutters and drainage",
    ],
    ...industryImages("roofing", `${ESTIMATE_HERO}/construction/hero-dark.webp`),
    imageAlt: "Roofing",
  },
  {
    id: "painting-facades",
    title: "Painting and facades",
    items: [
      "Interior painting and unit refurbishments",
      "plaster, skim coats and drywall",
      "facades, insulation and exterior renewal",
    ],
    ...industryImages("painting-facades", `${ESTIMATE_HERO}/carpentry/hero-dark.webp`),
    imageAlt: "Painting and facades",
  },
  {
    id: "wedding-planning",
    title: "Wedding planning",
    items: [
      "Wedding agencies and professional planners",
      "ceremony, reception and timeline coordination",
      "decor, vendors, logistics and day-of management",
    ],
    ...industryImages("wedding-planning", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Wedding planning",
  },
  {
    id: "floristry",
    title: "Floristry",
    items: [
      "Wedding, occasion and event floral designs",
      "bouquets, wreaths and venue decorations",
      "flower deliveries for businesses, hotels and private clients",
    ],
    ...industryImages("floristry", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Floristry",
  },
  {
    id: "catering",
    title: "Catering",
    items: [
      "Conference, event and wedding catering",
      "banquets, receptions and corporate functions",
      "menus, logistics, on-site service and equipment hire",
    ],
    ...industryImages("catering", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Catering",
  },
  {
    id: "photography",
    title: "Photography",
    items: [
      "Wedding, commercial and product photography",
      "studio, outdoor and on-site shoots",
      "event coverage, brand sessions and project reports",
    ],
    ...industryImages("photography", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Photography",
  },
  {
    id: "interior-design",
    title: "Interior design",
    items: [
      "Residential homes and office space design",
      "concepts, visualizations and finish material selection",
      "author supervision, schedules and cost estimates",
    ],
    ...industryImages("interior-design", `${ESTIMATE_HERO}/carpentry/hero-dark.webp`),
    imageAlt: "Interior design",
  },
  {
    id: "cleaning",
    title: "Cleaning companies",
    items: [
      "Office, retail and commercial property cleaning",
      "post-construction, developer and specialist cleaning",
      "recurring contracts, hospitality and facility upkeep",
    ],
    ...industryImages("cleaning", `${ESTIMATE_HERO}/services/hero-dark.webp`),
    imageAlt: "Cleaning companies",
  },
];

export function getHeroIndustries(locale: Locale): HeroIndustryCard[] {
  return locale === "pl" ? heroIndustriesPl : heroIndustriesEn;
}

export function getHeroIndustriesCopy(locale: Locale) {
  return locale === "pl"
    ? {
        previous: "Poprzednia branża",
        next: "Następna branża",
      }
    : {
        previous: "Previous industry",
        next: "Next industry",
      };
}
