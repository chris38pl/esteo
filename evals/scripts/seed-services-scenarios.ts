import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesDir = join(__dirname, "..", "services");

const OTHER_V2_FORBIDDEN_SECTIONS = [
  "Zakres",
  "Uwagi",
  "Opis",
  "Oferta",
  "Kosztorys",
  "Wycena",
  "Łazienka",
  "Prace rozbiórkowe",
];

type ScenarioDef = {
  file: string;
  data: Record<string, unknown>;
};

function businessScenario(
  id: string,
  name: string,
  opts: {
    industryOtherText: string;
    companyDescription: string;
    aiInstructions?: string;
    rules?: Array<{ title: string; content: string }>;
    description: string;
    mustHave?: Array<string | { term: string; scope?: "any_item" | "any_section" | "section_title" }>;
    mustNotHave?: string[];
    coverageTerms: string[];
    critical?: boolean;
    quick?: boolean;
    referenceEstimate?: Record<string, unknown>;
    voiceIntake?: { transcript: string; locale: string } | null;
    estimateSections?: Array<Record<string, unknown>>;
    minimumDistinctSections?: number;
    minLineItems?: number;
  },
): ScenarioDef {
  const workspace: Record<string, unknown> = {
    industry: "OTHER",
    industryOtherText: opts.industryOtherText,
    companyDescription: opts.companyDescription,
    aiInstructions: opts.aiInstructions ?? "",
    rules: opts.rules ?? [],
    systemRules: { rounding: true, units: true },
  };
  if (opts.estimateSections) {
    workspace.estimateSections = opts.estimateSections;
  }

  return {
    file: `${id}.json`,
    data: {
      id,
      name,
      locale: "pl",
      category: "business",
      quick: opts.quick ?? false,
      critical: opts.critical ?? false,
      workspace,
      request: {
        customer: {
          fullName: "Anna Kowalska",
          email: "anna@example.com",
          phone: "+48 500 100 200",
        },
        project: {
          description: opts.description,
          preferredStartDate: "3_6_months",
        },
        address: { serviceLocation: "Kraków, woj. małopolskie" },
      },
      voiceIntake: opts.voiceIntake ?? null,
      referenceEstimate: opts.referenceEstimate,
      expectations: {
        mustHave: opts.mustHave.map((entry) =>
          typeof entry === "string"
            ? { term: entry, scope: "any_item" as const }
            : { term: entry.term, scope: entry.scope ?? ("any_item" as const) },
        ),
        mustNotHave: (opts.mustNotHave ?? []).map((term) => ({ term, scope: "any_item" })),
        coverageTerms: opts.coverageTerms,
        requiredSections: [],
        forbiddenSections: OTHER_V2_FORBIDDEN_SECTIONS,
        ...(opts.minimumDistinctSections != null
          ? { minimumDistinctSections: opts.minimumDistinctSections }
          : {}),
        leakageDomain: "construction",
        maxLeakageTerms: 0,
        minLineItems: opts.minLineItems ?? 4,
        maxLineItems: 35,
        judge: {
          focus: [
            "Zgodność z opisem firmy i briefem klienta",
            "Brak usług spoza zakresu firmy",
          ],
          minScore: 7,
          minContextAlignment: 7,
          minReferenceSimilarity: 7,
        },
      },
    },
  };
}

/** Fallback workspace: vague industryOtherText, no company profile — tests Services prompt without niche context. */
function genericScenario(
  id: string,
  name: string,
  opts: {
    industryOtherText?: string;
    companyDescription?: string;
    description: string;
    mustHave?: string[];
    mustNotHave?: string[];
    coverageTerms?: string[];
    quick?: boolean;
    minLineItems?: number;
    maxLineItems?: number;
    maxLeakageTerms?: number;
    judge?: { minScore: number; minContextAlignment: number; minReferenceSimilarity: number };
  },
): ScenarioDef {
  const baseMustNot = ["płytki", ...(opts.mustNotHave ?? [])];
  return {
    file: `generic/${id}.json`,
    data: {
      id,
      name,
      locale: "pl",
      category: "generic",
      quick: opts.quick ?? false,
      workspace: {
        industry: "OTHER",
        industryOtherText: opts.industryOtherText ?? "Usługi",
        companyDescription: opts.companyDescription ?? "",
      },
      request: {
        project: { description: opts.description },
      },
      expectations: {
        mustHave: (opts.mustHave ?? []).map((term) => ({ term, scope: "any_item" })),
        mustNotHave: baseMustNot.map((term) => ({ term, scope: "any_item" })),
        coverageTerms: opts.coverageTerms ?? [],
        requiredSections: [],
        forbiddenSections: OTHER_V2_FORBIDDEN_SECTIONS,
        leakageDomain: "construction",
        maxLeakageTerms: opts.maxLeakageTerms ?? 1,
        minLineItems: opts.minLineItems ?? 3,
        maxLineItems: opts.maxLineItems ?? 25,
        judge: opts.judge ?? { minScore: 5, minContextAlignment: 4, minReferenceSimilarity: 5 },
      },
    },
  };
}

const genericScenarios: ScenarioDef[] = [
  genericScenario("generic-uslugi", "Generic: Usługi", {
    quick: true,
    description:
      "Potrzebuję wyceny usług dla mojej firmy, zakres do ustalenia na spotkaniu.",
    coverageTerms: ["usług"],
  }),
  genericScenario("generic-remont-mieszkania", "Generic: Remont mieszkania", {
    description:
      "Remont mieszkania 68 m² w Warszawie: malowanie ścian i sufitów, wymiana podłóg w salonie i sypialni, odświeżenie łazienki bez rozbiórki.",
    mustHave: ["malowanie"],
    mustNotHave: ["murowanie", "beton"],
    coverageTerms: ["malowanie", "podłog", "łazienk"],
    maxLeakageTerms: 0,
  }),
  genericScenario("generic-konsulting", "Generic: Konsulting", {
    description:
      "Audyt procesów sprzedaży i 2-dniowe warsztaty strategiczne dla zarządu (8 osób), Kraków.",
    mustHave: ["warsztat", "audyt"],
    coverageTerms: ["warsztat", "audyt"],
  }),
  genericScenario("generic-uslugi-kreatywne", "Generic: Usługi kreatywne", {
    description:
      "Projekt logo, wizytówki i szablony prezentacji dla startupu fintech. 2 rundy poprawek.",
    mustHave: ["logo"],
    coverageTerms: ["logo", "identyfikac", "wizytówk"],
  }),
  genericScenario("generic-organizacja-eventu", "Generic: Organizacja eventu", {
    description:
      "Organizacja konferencji branżowej dla 150 uczestników w Krakowie — koordynacja merytoryczna i logistyka. Catering po stronie klienta.",
    mustHave: ["konferenc", "koordynac"],
    mustNotHave: ["catering"],
    coverageTerms: ["konferenc", "koordynac", "logistyk"],
  }),
  genericScenario("generic-szkolenia", "Generic: Szkolenia", {
    description:
      "Szkolenie BHP i pierwszej pomocy dla 35 pracowników zakładu produkcyjnego, jedna sesja 6 godzin.",
    mustHave: ["szkolen", "BHP"],
    coverageTerms: ["szkolen", "BHP"],
  }),
  genericScenario("generic-niejednoznaczny-opis", "Generic: Niejednoznaczny opis", {
    description:
      "Potrzebuję wyceny dla mojej firmy. Co dokładnie — zobaczymy na spotkaniu wstępnym, zależy od budżetu i terminu.",
    coverageTerms: ["usług"],
    minLineItems: 2,
    judge: { minScore: 4, minContextAlignment: 4, minReferenceSimilarity: 4 },
  }),
  genericScenario("generic-bardzo-krotki-opis", "Generic: Bardzo krótki opis", {
    description: "Wycena usług.",
    coverageTerms: ["usług"],
    minLineItems: 2,
    judge: { minScore: 4, minContextAlignment: 4, minReferenceSimilarity: 4 },
  }),
  genericScenario("generic-bardzo-dlug-opis", "Generic: Bardzo długi opis", {
    description: `${"Opis projektu usługowego. ".repeat(100)}Na końcu: potrzebujemy osobno wycenić warsztat wprowadzający (1 dzień) oraz miesięczny abonament konsultingowy. Materiały szkoleniowe po stronie klienta.`,
    mustHave: ["warsztat", "abonament"],
    coverageTerms: ["warsztat", "abonament", "konsult"],
    minLineItems: 4,
    maxLineItems: 35,
    judge: { minScore: 5, minContextAlignment: 5, minReferenceSimilarity: 5 },
  }),
];

const scenarios: ScenarioDef[] = [
  businessScenario("wedding-planner", "Wedding Planner", {
    industryOtherText: "Organizacja wesel i koordynacja wydarzeń",
    companyDescription:
      "Studio planowania wesel premium. Koordynujemy harmonogram, dostawców, dekorację sali z podwykonawcami i dzień ślubu. Nie świadczymy cateringu, transportu ani fotografii.",
    aiInstructions:
      "Wydziel konsultację wstępną i koordynację dnia ślubu jako osobne pozycje. Ceny w pakietach godzinowych.",
    rules: [
      {
        title: "Wyłączenia",
        content:
          "Nigdy nie wyceniaj cateringu, transportu gości ani oprawy muzycznej — to poza zakresem firmy.",
      },
    ],
    description:
      "Wesele 120 osób, Kraków, czerwiec 2027. Potrzebuję pełnej koordynacji dnia ślubu, harmonogramu, spotkań z podwykonawcami i dekoracji sali. Catering i DJ już mamy.",
    mustHave: ["koordynacja", "harmonogram", "spotkanie", "dekoracje"],
    mustNotHave: ["catering", "transport"],
    coverageTerms: ["koordynacja", "dekoracje", "harmonogram", "podwykonawc"],
    critical: true,
    quick: true,
    referenceEstimate: {
      sections: [
        {
          title: "Konsultacja wstępna",
          sortOrder: 0,
          items: [
            { name: "Spotkanie konsultacyjne", unit: "h", quantity: 2, unitPrice: 200, vatRate: 0.23, sortOrder: 0 },
          ],
        },
        {
          title: "Koordynacja dnia ślubu",
          sortOrder: 1,
          items: [
            { name: "Koordynacja dnia ślubu", unit: "h", quantity: 10, unitPrice: 150, vatRate: 0.23, sortOrder: 0 },
          ],
        },
        {
          title: "Harmonogram i spotkania z podwykonawcami",
          sortOrder: 2,
          items: [
            { name: "Przygotowanie harmonogramu", unit: "szt.", quantity: 1, unitPrice: 500, vatRate: 0.23, sortOrder: 0 },
            { name: "Spotkania z podwykonawcami", unit: "h", quantity: 5, unitPrice: 100, vatRate: 0.23, sortOrder: 1 },
          ],
        },
        {
          title: "Dekoracja sali",
          sortOrder: 3,
          items: [
            { name: "Projekt dekoracji", unit: "szt.", quantity: 1, unitPrice: 800, vatRate: 0.23, sortOrder: 0 },
            { name: "Koordynacja dekoracji", unit: "h", quantity: 8, unitPrice: 120, vatRate: 0.23, sortOrder: 1 },
          ],
        },
      ],
      suggestedMarginPercent: null,
    },
  }),
  businessScenario("accounting-office", "Accounting Office", {
    industryOtherText: "Biuro rachunkowe",
    companyDescription:
      "Biuro rachunkowe obsługujące JDG i małe spółki. Prowadzimy KPiR, księgowanie faktur i rozliczenia ZUS. Oferujemy krótkie konsultacje księgowe. Nie świadczymy doradztwa prawnego.",
    aiInstructions:
      "Wyceniaj comiesięczną obsługę jako pozycje z jednostką «miesiąc» i quantity 1. Uwzględnij obsługę faktur kosztowych.",
    description:
      "Jednoosobowa działalność gastronomiczna, 40 faktur miesięcznie, KPiR, potrzebuję comiesięcznej obsługi księgowej i rozliczeń ZUS.",
    mustHave: ["księgow", "KPiR", "ZUS"],
    mustNotHave: ["remont", "płytki"],
    coverageTerms: ["KPiR", "ZUS", "faktur", "księgow"],
    critical: true,
    quick: true,
    minLineItems: 3,
    referenceEstimate: {
      sections: [
        {
          title: "Obsługa księgowa",
          sortOrder: 0,
          items: [
            { name: "Prowadzenie KPiR", unit: "miesiąc", quantity: 1, unitPrice: 500, vatRate: 0.23, sortOrder: 0 },
            { name: "Rozliczenia ZUS", unit: "miesiąc", quantity: 1, unitPrice: 150, vatRate: 0.23, sortOrder: 1 },
            { name: "Księgowanie faktur kosztowych", unit: "miesiąc", quantity: 1, unitPrice: 200, vatRate: 0.23, sortOrder: 2 },
          ],
        },
      ],
      suggestedMarginPercent: null,
    },
  }),
  businessScenario("law-firm", "Law Firm", {
    industryOtherText: "Kancelaria prawna",
    companyDescription:
      "Kancelaria prawna — prawo gospodarcze i umowy B2B. Nie prowadzimy spraw karnych ani nie wykonujemy remontów.",
    description:
      "Potrzebuję przygotowania i negocjacji umowy najmu lokalu użytkowego 200 m² w Warszawie, z terminem 2 miesięcy.",
    mustHave: ["umow", "negocjac"],
    mustNotHave: ["remont", "tynk", "płytki"],
    coverageTerms: ["umowa", "najem", "negocjac"],
  }),
  businessScenario("marketing-agency", "Marketing Agency", {
    industryOtherText: "Agencja marketingowa",
    companyDescription:
      "Agencja marketingowa B2B — strategia, content, kampanie. Nie produkujemy oprogramowania ani nie wykonujemy remontów biur.",
    description:
      "Kampania wprowadzenia nowego produktu SaaS na rynek polski, 3 miesiące, budżet mediowy po stronie klienta, potrzebuję strategii i kreacji.",
    mustHave: ["strateg", { term: "kampan", scope: "any_section" }],
    mustNotHave: ["programowanie", "remont"],
    coverageTerms: ["strategia", "kampania", "kreacja"],
    critical: true,
    referenceEstimate: {
      sections: [
        {
          title: "Strategia Kampanii",
          sortOrder: 0,
          items: [
            { name: "Opracowanie strategii marketingowej", unit: "kpl.", quantity: 1, unitPrice: 5000, vatRate: 0.23, sortOrder: 0 },
            { name: "Analiza rynku i konkurencji", unit: "kpl.", quantity: 1, unitPrice: 3000, vatRate: 0.23, sortOrder: 1 },
          ],
        },
        {
          title: "Kreacja Kampanii",
          sortOrder: 1,
          items: [
            { name: "Projektowanie graficzne materiałów promocyjnych", unit: "kpl.", quantity: 1, unitPrice: 4000, vatRate: 0.23, sortOrder: 0 },
            { name: "Tworzenie treści reklamowych", unit: "kpl.", quantity: 1, unitPrice: 3500, vatRate: 0.23, sortOrder: 1 },
          ],
        },
        {
          title: "Zarządzanie Kampanią",
          sortOrder: 2,
          items: [
            { name: "Koordynacja działań marketingowych", unit: "miesiąc", quantity: 3, unitPrice: 2000, vatRate: 0.23, sortOrder: 0 },
            { name: "Raportowanie i analiza wyników", unit: "miesiąc", quantity: 3, unitPrice: 1500, vatRate: 0.23, sortOrder: 1 },
          ],
        },
      ],
      suggestedMarginPercent: null,
    },
  }),
  businessScenario("it-consulting", "IT Consulting", {
    industryOtherText: "Konsulting IT",
    companyDescription:
      "Konsulting IT — audyt, architektura, roadmapa. Nie wykonujemy developmentu ani utrzymania serwerów.",
    aiInstructions: "Nie wyceniaj programowania ani wdrożenia — tylko doradztwo i dokumentacja.",
    description:
      "Audyt architektury systemu ERP przed migracją do chmury, 80 użytkowników, warsztaty z zespołem IT klienta.",
    mustHave: [{ term: "audyt", scope: "any_section" }, "architektur", "warsztat"],
    mustNotHave: ["programowanie", "wdrożenie", "kod"],
    coverageTerms: ["audyt", "architektura", "warsztat"],
    critical: true,
    quick: true,
    minimumDistinctSections: 2,
    referenceEstimate: {
      sections: [
        {
          title: "Audyt architektury systemu ERP",
          sortOrder: 0,
          items: [
            { name: "Przegląd dokumentacji systemu", unit: "h", quantity: 20, unitPrice: 200, vatRate: 0.23, sortOrder: 0 },
            { name: "Analiza obecnej architektury", unit: "h", quantity: 30, unitPrice: 200, vatRate: 0.23, sortOrder: 1 },
            { name: "Raport z rekomendacjami", unit: "szt.", quantity: 1, unitPrice: 1000, vatRate: 0.23, sortOrder: 2 },
          ],
        },
        {
          title: "Warsztaty z zespołem IT",
          sortOrder: 1,
          items: [
            { name: "Przygotowanie materiałów szkoleniowych", unit: "h", quantity: 10, unitPrice: 150, vatRate: 0.23, sortOrder: 0 },
            { name: "Przeprowadzenie warsztatów", unit: "h", quantity: 16, unitPrice: 250, vatRate: 0.23, sortOrder: 1 },
          ],
        },
      ],
      suggestedMarginPercent: null,
    },
  }),
  businessScenario("wedding-photographer", "Wedding Photographer", {
    industryOtherText: "Fotograf ślubny",
    companyDescription: "Fotografia ślubna i plenerowa. Nie oferujemy koordynacji wesela ani wideo.",
    description: "Ślub kościelny + plener w Tatrach, 8 godzin reportażu, album 30x30 i galeria online.",
    mustHave: ["fotograf", "plener", "reportaż"],
    mustNotHave: ["koordynac", "catering"],
    coverageTerms: ["ślub", "plener", "album", "reportaż"],
  }),
  businessScenario("event-dj", "Event DJ", {
    industryOtherText: "DJ i wodzirej",
    companyDescription: "Oprawa muzyczna wesel i eventów. Nie świadczymy cateringu ani organizacji wesel.",
    description: "Wesele 100 osób, 6 godzin oprawy, nagłośnienie i oświetlenie parkietu, Kraków.",
    mustHave: ["DJ", "nagłośnien", "oświetlen"],
    mustNotHave: ["catering", "koordynac"],
    coverageTerms: ["DJ", "parkiet", "nagłośnienie", "wodzirej"],
  }),
  businessScenario("seo-agency", "SEO Agency", {
    industryOtherText: "Agencja SEO",
    companyDescription: "SEO i content marketing. Nie prowadzimy kampanii Google Ads.",
    description: "Audyt SEO sklepu internetowego, 5000 produktów, optymalizacja on-page i plan contentu na 6 miesięcy.",
    mustHave: ["audyt", "SEO", "content"],
    mustNotHave: ["Google Ads", "płatne kampanie"],
    coverageTerms: ["audyt", "SEO", "content"],
  }),
  businessScenario("interior-designer", "Interior Designer", {
    industryOtherText: "Projektant wnętrz",
    companyDescription: "Projektowanie wnętrz mieszkalnych — koncepcja i dokumentacja. Nie wykonujemy prac budowlanych.",
    description: "Projekt mieszkania 65 m², styl skandynawski, wizualizacje 3D i lista materiałów.",
    mustHave: ["projekt", "wizualizac", "koncepc"],
    mustNotHave: ["wykonawstw", "płytki", "tynk"],
    coverageTerms: ["projekt", "wizualizacja", "materiały", "koncepcja"],
  }),
  businessScenario("graphic-designer", "Graphic Designer", {
    industryOtherText: "Grafik",
    companyDescription: "Identyfikacja wizualna i materiały drukowane. Nie prowadzimy kampanii reklamowych.",
    description: "Rebranding logo i podstawowych materiałów firmowych dla startupu fintech, 2 rundy poprawek.",
    mustHave: ["logo", "identyfikac", "materiały"],
    mustNotHave: ["kampania", "remont"],
    coverageTerms: ["logo"],
  }),
  businessScenario("copywriter", "Copywriter", {
    industryOtherText: "Copywriter",
    companyDescription: "Copywriting B2B — strony, blog, case studies. Nie zajmujemy się SEO technicznym.",
    description: "Teksty na nową stronę firmową SaaS, 8 podstron + 4 artykuły blogowe, ton profesjonalny.",
    mustHave: ["tekst", "copy", "stron"],
    mustNotHave: ["SEO technicz", "programowanie"],
    coverageTerms: ["strona", "blog", "tekst"],
  }),
  businessScenario("social-media-agency", "Social Media Agency", {
    industryOtherText: "Agencja social media",
    companyDescription: "Prowadzenie social mediów i community management. Nie produkujemy spotów wideo.",
    description: "Obsługa LinkedIn i Instagram dla firmy consultingowej, 12 postów miesięcznie, community management.",
    mustHave: ["post", "social", "community"],
    mustNotHave: ["produkcja wideo", "remont"],
    coverageTerms: ["LinkedIn", "Instagram", "post", "community"],
  }),
  businessScenario("recruitment-agency", "Recruitment Agency", {
    industryOtherText: "Agencja rekrutacyjna",
    companyDescription: "Rekrutacja specjalistów IT. Model success fee lub flat fee.",
    description: "Rekrutacja Senior Backend Developera, Node.js, proces 4 etapów, start ASAP.",
    mustHave: ["rekrutac"],
    mustNotHave: ["programowanie", "szkolenie IT"],
    coverageTerms: ["rekrutacja", "kandydat"],
  }),
  businessScenario("business-consultant", "Business Consultant", {
    industryOtherText: "Konsulting biznesowy",
    companyDescription: "Doradztwo strategiczne dla MŚP — warsztaty, analiza, raport wdrożeniowy.",
    description: "Warsztaty strategiczne dla zarządu firmy produkcyjnej 50 osób, analiza procesów sprzedaży.",
    mustHave: ["warsztat", "analiz", "raport"],
    mustNotHave: ["programowanie", "remont"],
    coverageTerms: ["warsztat", "analiza", "raport"],
  }),
  businessScenario("cleaning-company", "Cleaning Company", {
    industryOtherText: "Firma sprzątająca",
    companyDescription: "Sprzątanie biur i lokali komercyjnych. Chemia po stronie wykonawcy.",
    description: "Sprzątanie biura 350 m², 3 razy w tygodniu, mycie okien raz w miesiącu, Kraków.",
    mustHave: ["sprzątan", "m²", "okien"],
    mustNotHave: ["remont", "malowanie"],
    coverageTerms: ["sprzątanie", "biuro", "okna", "mycie"],
    voiceIntake: {
      transcript:
        "Potrzebuję wyceny sprzątania biura około 350 metrów w Krakowie, trzy razy w tygodniu, plus mycie okien raz w miesiącu.",
      locale: "pl",
    },
  }),
  businessScenario("catering-company", "Catering Company", {
    industryOtherText: "Catering",
    companyDescription: "Catering eventowy — menu, obsługa kelnerska. Nie wynajmujemy sal ani nie organizujemy wesel.",
    description: "Catering dla konferencji 150 osób, przerwa kawowa i lunch, menu wegetariańskie w 30%.",
    mustHave: ["catering", "menu", "obsługa"],
    mustNotHave: ["wynajem sali", "koordynac"],
    coverageTerms: ["catering", "menu", "konferencja"],
  }),
  businessScenario("personal-trainer", "Personal Trainer", {
    industryOtherText: "Trener personalny",
    companyDescription: "Trening personalny i plan ćwiczeń. Nie prowadzimy dietetyki klinicznej.",
    description: "Trening personalny 2x w tygodniu przez 3 miesiące, plan ćwiczeń domowych, Warszawa Mokotów.",
    mustHave: ["trening", "plan"],
    mustNotHave: ["dieta klinicz", "fizjoterap"],
    coverageTerms: ["trening", "plan", "ćwiczeń"],
  }),
  businessScenario("language-school", "Language School", {
    industryOtherText: "Szkoła językowa",
    companyDescription: "Kursy języka angielskiego B2B i indywidualne. Materiały w cenie.",
    description: "Kurs angielskiego biznesowego dla zespołu 8 osób, 2x w tygodniu, poziom B1-B2, 4 miesiące.",
    mustHave: ["kurs", "angielski", "materiały"],
    mustNotHave: ["tłumaczen", "remont"],
    coverageTerms: ["kurs", "angielski", "materiały"],
  }),
  businessScenario("architect", "Architect", {
    industryOtherText: "Architekt",
    companyDescription: "Projekty architektoniczne i nadzór autorski. Nie wykonujemy prac budowlanych.",
    description: "Projekt budowlany domu jednorodzinnego 140 m², nadzór autorski, Poznań.",
    mustHave: ["projekt", "budowlany", "nadzór"],
    mustNotHave: ["wykonawstw", "tynk", "płytki"],
    coverageTerms: ["projekt", "budowlany", "nadzór"],
  }),
  businessScenario("real-estate-agent", "Real Estate Agent", {
    industryOtherText: "Agent nieruchomości",
    companyDescription: "Pośrednictwo w sprzedaży mieszkań i domów. Nie wykonujemy remontów.",
    description: "Sprzedaż mieszkania 72 m² Kraków, pakiet marketingowy, sesja zdjęciowa, prowizja success fee.",
    mustHave: ["pośrednictw", "marketing", "prowizj"],
    mustNotHave: ["remont", "wykończen"],
    coverageTerms: ["sprzedaż", "marketing", "prowizja", "zdjęcia"],
  }),
];

const edgeAndStress: ScenarioDef[] = [
  {
    file: "edge/empty-company-context.json",
    data: {
      id: "edge-empty-company-context",
      name: "Empty Company Context",
      locale: "pl",
      category: "edge",
      workspace: {
        industry: "OTHER",
        industryOtherText: "Organizacja wesel",
        companyDescription: "",
        rules: [],
      },
      request: {
        project: {
          description:
            "Wesele 80 osób w Warszawie, potrzebuję koordynacji dnia ślubu i harmonogramu. Bez cateringu.",
        },
      },
      expectations: {
        mustHave: [{ term: "koordynac", scope: "any_item" }],
        mustNotHave: [{ term: "catering", scope: "any_item" }],
        coverageTerms: ["koordynacja", "harmonogram"],
        requiredSections: [],
        forbiddenSections: OTHER_V2_FORBIDDEN_SECTIONS,
        leakageDomain: "construction",
        maxLeakageTerms: 0,
        minLineItems: 3,
        maxLineItems: 30,
        judge: { minScore: 6, minContextAlignment: 5, minReferenceSimilarity: 5 },
      },
    },
  },
  {
    file: "edge/contradicting-rules.json",
    data: {
      id: "edge-contradicting-rules",
      name: "Contradicting Rules",
      locale: "pl",
      category: "edge",
      quick: true,
      workspace: {
        industry: "OTHER",
        industryOtherText: "Organizacja wesel",
        companyDescription: "Koordynacja wesel. Nie oferujemy cateringu.",
        aiInstructions: "Uwzględnij catering w wycenie jeśli klient o to prosi.",
        rules: [
          { title: "Wyłączenia", content: "Nigdy nie uwzględniaj cateringu w wycenie." },
        ],
      },
      request: {
        project: {
          description: "Wesele 100 osób, potrzebuję koordynacji i cateringu dla gości.",
        },
      },
      expectations: {
        mustHave: [{ term: "koordynac", scope: "any_item" }],
        mustNotHave: [{ term: "catering", scope: "any_item" }],
        coverageTerms: ["koordynacja"],
        requiredSections: [],
        forbiddenSections: OTHER_V2_FORBIDDEN_SECTIONS,
        leakageDomain: "construction",
        maxLeakageTerms: 0,
        minLineItems: 3,
        maxLineItems: 25,
        judge: { minScore: 6, minContextAlignment: 6, minReferenceSimilarity: 5 },
      },
    },
  },
  {
    file: "edge/extremely-short-brief.json",
    data: {
      id: "edge-extremely-short-brief",
      name: "Extremely Short Brief",
      locale: "pl",
      category: "edge",
      workspace: {
        industry: "OTHER",
        industryOtherText: "Organizacja wesel",
        companyDescription: "Planowanie wesel.",
      },
      request: {
        project: { description: "Potrzebuję organizacji wesela." },
      },
      expectations: {
        mustHave: [],
        mustNotHave: [],
        coverageTerms: ["wesel"],
        requiredSections: [],
        forbiddenSections: OTHER_V2_FORBIDDEN_SECTIONS,
        leakageDomain: "construction",
        maxLeakageTerms: 1,
        minLineItems: 3,
        maxLineItems: 20,
        judge: { minScore: 5, minContextAlignment: 5, minReferenceSimilarity: 5 },
      },
    },
  },
  {
    file: "edge/extremely-long-brief.json",
    data: {
      id: "edge-extremely-long-brief",
      name: "Extremely Long Brief",
      locale: "pl",
      category: "edge",
      workspace: {
        industry: "OTHER",
        industryOtherText: "Organizacja wesel",
        companyDescription: "Kompleksowa organizacja wesel — koordynacja, harmonogram, dostawcy.",
      },
      request: {
        project: {
          description: `${"Szczegółowy brief weselny. ".repeat(120)}Na końcu: wymagamy osobnej pozycji dla koordynacji kościoła i sali oraz harmonogramu minutowego. Wyłączamy catering z wyceny.`,
        },
      },
      expectations: {
        mustHave: [
          { term: "koordynac", scope: "any_item" },
          { term: "harmonogram", scope: "any_item" },
        ],
        mustNotHave: [{ term: "catering", scope: "any_item" }],
        coverageTerms: ["koordynacja", "harmonogram", "kościół"],
        requiredSections: [],
        forbiddenSections: OTHER_V2_FORBIDDEN_SECTIONS,
        leakageDomain: "construction",
        maxLeakageTerms: 0,
        minLineItems: 4,
        maxLineItems: 40,
        judge: { minScore: 6, minContextAlignment: 6, minReferenceSimilarity: 5 },
      },
    },
  },
  {
    file: "stress/overconfigured-workspace.json",
    data: {
      id: "stress-overconfigured",
      name: "Overconfigured Workspace",
      locale: "pl",
      category: "stress",
      workspace: {
        industry: "OTHER",
        industryOtherText: "Agencja marketingowa full-service",
        companyDescription: "A".repeat(1200),
        aiInstructions: "Reguła ogólna nr 1. ".repeat(20),
        estimateSections: Array.from({ length: 15 }, (_, i) => ({
          key: `section_${i + 1}`,
          titlePl: `Sekcja ${i + 1}`,
          titleEn: `Section ${i + 1}`,
          rulePl: `Reguła sekcji ${i + 1} — szczegóły wyliczeń.`,
          active: true,
        })),
        rules: Array.from({ length: 10 }, (_, i) => ({
          title: `Reguła ESTIMATE ${i + 1}`,
          content: `Treść reguły wyceny numer ${i + 1} dla workspace.`,
        })),
      },
      request: {
        project: {
          description:
            "Kampania Q4 dla marki FMCG, budżet mediowy 500k PLN, potrzebuję strategii, kreacji i raportowania.",
        },
      },
      expectations: {
        mustHave: [{ term: "strateg", scope: "any_item" }],
        mustNotHave: [{ term: "remont", scope: "any_item" }],
        coverageTerms: ["strategia", "kampania", "kreacja"],
        requiredSections: [],
        forbiddenSections: OTHER_V2_FORBIDDEN_SECTIONS,
        leakageDomain: "construction",
        maxLeakageTerms: 0,
        minLineItems: 4,
        maxLineItems: 50,
        judge: { minScore: 6, minContextAlignment: 6, minReferenceSimilarity: 5 },
      },
    },
  },
  {
    file: "stress/toxic-workspace.json",
    data: {
      id: "stress-toxic-workspace",
      name: "Toxic Workspace",
      locale: "pl",
      category: "stress",
      quick: true,
      workspace: {
        industry: "OTHER",
        industryOtherText: "Organizacja wesel",
        companyDescription: "Koordynacja wesel bez cateringu.",
        rules: [
          { title: "Catering tak", content: "Uwzględnij catering w każdej wycenie weselnej." },
          { title: "Catering nie", content: "Nigdy nie uwzględniaj cateringu w wycenie." },
        ],
      },
      request: {
        project: {
          description: "Wesele 90 osób, koordynacja i harmonogram. Catering po stronie rodziny.",
        },
      },
      expectations: {
        mustHave: [{ term: "koordynac", scope: "any_item" }],
        mustNotHave: [{ term: "catering", scope: "any_item" }],
        coverageTerms: ["koordynacja", "harmonogram"],
        requiredSections: [],
        forbiddenSections: OTHER_V2_FORBIDDEN_SECTIONS,
        leakageDomain: "construction",
        maxLeakageTerms: 0,
        minLineItems: 3,
        maxLineItems: 25,
        judge: { minScore: 6, minContextAlignment: 6, minReferenceSimilarity: 5 },
      },
    },
  },
];

for (const scenario of [...scenarios, ...edgeAndStress, ...genericScenarios]) {
  const filePath = join(servicesDir, scenario.file);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(scenario.data, null, 2), "utf8");
  console.log("wrote", scenario.file);
}
