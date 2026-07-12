import type { Locale } from "@/lib/locale";

import { siteConfig } from "@/features/marketing/seo/site-config";

export type LegalOperatorStatus = "pre_company" | "registered";

export type ServiceProviderCategory =
  | "authentication"
  | "payments"
  | "hosting"
  | "database"
  | "storage"
  | "ai";

export type ServiceProvider = {
  id: string;
  name: string;
  category: ServiceProviderCategory;
  description: string;
};

export const legalOperatorConfig = {
  status: "pre_company" as LegalOperatorStatus,
  email: siteConfig.supportEmail,
  contactPath: "/contact",
  legalName: null as string | null,
  vatId: null as string | null,
  registeredAddress: null as string | null,
};

export const legalLastUpdated = {
  pl: "12 lipca 2026",
  en: "July 12, 2026",
} satisfies Record<Locale, string>;

const categoryLabels: Record<Locale, Record<ServiceProviderCategory, string>> = {
  pl: {
    authentication: "Uwierzytelnianie",
    payments: "Płatności",
    hosting: "Hosting",
    database: "Baza danych",
    storage: "Przechowywanie",
    ai: "AI",
  },
  en: {
    authentication: "Authentication",
    payments: "Payments",
    hosting: "Hosting",
    database: "Database",
    storage: "Storage",
    ai: "AI",
  },
};

export function getServiceProviderCategoryLabel(
  locale: Locale,
  category: ServiceProviderCategory,
): string {
  return categoryLabels[locale][category];
}

export const serviceProviders: Record<Locale, ServiceProvider[]> = {
  pl: [
    {
      id: "clerk",
      name: "Clerk",
      category: "authentication",
      description: "Logowanie i zarządzanie użytkownikami.",
    },
    {
      id: "stripe",
      name: "Stripe",
      category: "payments",
      description: "Obsługa płatności i subskrypcji.",
    },
    {
      id: "vercel",
      name: "Vercel",
      category: "hosting",
      description: "Hosting aplikacji.",
    },
    {
      id: "neon",
      name: "Neon",
      category: "database",
      description: "Baza danych.",
    },
    {
      id: "uploadthing",
      name: "UploadThing",
      category: "storage",
      description: "Przechowywanie przesyłanych plików.",
    },
    {
      id: "openai",
      name: "OpenAI",
      category: "ai",
      description: "Funkcje wykorzystujące sztuczną inteligencję.",
    },
  ],
  en: [
    {
      id: "clerk",
      name: "Clerk",
      category: "authentication",
      description: "Sign-in and user management.",
    },
    {
      id: "stripe",
      name: "Stripe",
      category: "payments",
      description: "Payments and subscriptions.",
    },
    {
      id: "vercel",
      name: "Vercel",
      category: "hosting",
      description: "Application hosting.",
    },
    {
      id: "neon",
      name: "Neon",
      category: "database",
      description: "Database.",
    },
    {
      id: "uploadthing",
      name: "UploadThing",
      category: "storage",
      description: "Uploaded file storage.",
    },
    {
      id: "openai",
      name: "OpenAI",
      category: "ai",
      description: "AI-powered features.",
    },
  ],
};

export const legalOperatorCopy: Record<
  Locale,
  {
    dataControllerParagraph: string;
    privacyContactLine: string;
    mvpDocumentNote: string;
    b2bAudienceParagraph: string;
    serviceProviderLiabilityLine: string;
    contactOperatorNote: string;
    securityHttpsLine: string;
    securityBackupLine: string;
  }
> = {
  pl: {
    dataControllerParagraph:
      "Operatorem usługi Esteo jest podmiot świadczący usługę wskazany na stronie Kontakt. Dane operatora zostaną uzupełnione po rozpoczęciu komercyjnej działalności.",
    privacyContactLine: `Kontakt w sprawach prywatności: ${legalOperatorConfig.email}.`,
    mvpDocumentNote:
      "Niniejszy dokument opisuje obecną wersję MVP usługi; dane operatora zostaną uzupełnione przed publicznym uruchomieniem komercyjnym.",
    b2bAudienceParagraph:
      "Esteo jest przeznaczone przede wszystkim dla przedsiębiorców i profesjonalistów. Platforma wspiera działalność gospodarczą i zawodową; korzystanie z usługi powinno odbywać się w związku z taką działalnością.",
    serviceProviderLiabilityLine:
      "Odpowiedzialność podmiotu świadczącego usługę jest ograniczona zgodnie z obowiązującymi przepisami.",
    contactOperatorNote:
      "Pełne dane operatora usługi zostaną uzupełnione przed publicznym uruchomieniem komercyjnym.",
    securityHttpsLine:
      "Komunikacja z aplikacją odbywa się przez szyfrowane połączenie HTTPS.",
    securityBackupLine:
      "Regularnie wykonujemy kopie zapasowe infrastruktury w celu zwiększenia bezpieczeństwa i możliwości odzyskania danych.",
  },
  en: {
    dataControllerParagraph:
      "The operator of Esteo is the party providing the service, as indicated on the Contact page. Operator details will be completed once commercial operations begin.",
    privacyContactLine: `Privacy contact: ${legalOperatorConfig.email}.`,
    mvpDocumentNote:
      "This document describes the current MVP version of the service; operator details will be completed before the public commercial launch.",
    b2bAudienceParagraph:
      "Esteo is intended primarily for entrepreneurs and professionals. The platform supports business and professional activity; you should use the service in connection with such activity.",
    serviceProviderLiabilityLine:
      "The service provider's liability is limited as permitted by applicable law.",
    contactOperatorNote:
      "Full service operator details will be published before the public commercial launch.",
    securityHttpsLine: "Communication with the application uses encrypted HTTPS connections.",
    securityBackupLine:
      "We regularly perform infrastructure backups to improve security and data recovery capability.",
  },
};

export const privacyRetentionRows: Record<Locale, { category: string; retention: string }[]> = {
  pl: [
    { category: "Konto", retention: "Do usunięcia konta" },
    { category: "Workspace", retention: "Do usunięcia przez właściciela" },
    { category: "Wyceny", retention: "Do usunięcia przez użytkownika" },
    { category: "Dane rozliczeniowe", retention: "Zgodnie z obowiązującymi przepisami prawa" },
    {
      category: "Logi techniczne",
      retention: "Przez ograniczony czas niezbędny do zapewnienia bezpieczeństwa",
    },
  ],
  en: [
    { category: "Account", retention: "Until account deletion" },
    { category: "Workspace", retention: "Until deleted by the owner" },
    { category: "Estimates", retention: "Until deleted by the user" },
    { category: "Billing data", retention: "As required by applicable law" },
    {
      category: "Technical logs",
      retention: "For a limited time necessary to maintain security",
    },
  ],
};

export const cookieCategoryRows: Record<
  Locale,
  { category: string; purpose: string; consentRequired: string }[]
> = {
  pl: [
    {
      category: "Niezbędne",
      purpose: "Logowanie, bezpieczeństwo, działanie aplikacji",
      consentRequired: "Nie",
    },
    {
      category: "Funkcjonalne",
      purpose: "Zapamiętanie języka i preferencji użytkownika",
      consentRequired: "Nie",
    },
    {
      category: "Analityczne",
      purpose: "Analiza korzystania z aplikacji (jeśli włączona)",
      consentRequired: "Tak",
    },
  ],
  en: [
    {
      category: "Essential",
      purpose: "Sign-in, security, core app functionality",
      consentRequired: "No",
    },
    {
      category: "Functional",
      purpose: "Remembering language and user preferences",
      consentRequired: "No",
    },
    {
      category: "Analytics",
      purpose: "Usage analytics (if enabled)",
      consentRequired: "Yes",
    },
  ],
};

export const cookieProviderRows: Record<Locale, { provider: string; purpose: string }[]> = {
  pl: [
    { provider: "Clerk", purpose: "Uwierzytelnianie" },
    { provider: "Stripe", purpose: "Obsługa płatności" },
    { provider: "Esteo", purpose: "Preferencje użytkownika (np. zgoda na cookies, język)" },
  ],
  en: [
    { provider: "Clerk", purpose: "Authentication" },
    { provider: "Stripe", purpose: "Payments" },
    { provider: "Esteo", purpose: "User preferences (e.g. cookie consent, language)" },
  ],
};

export const cookieConsentMvp = {
  analyticsProviderEnabled: false,
};

export const subprocessorsPageCopy: Record<
  Locale,
  {
    pageTitle: string;
    pageDescription: string;
    breadcrumbLabel: string;
    introParagraph: string;
    tableHeaders: [string, string, string];
    footnoteScope: string;
    footnoteUpdates: string;
  }
> = {
  pl: {
    pageTitle: "Dostawcy usług",
    pageDescription: "Z jakich zewnętrznych usług korzysta Esteo i w jakim celu.",
    breadcrumbLabel: "Dostawcy usług",
    introParagraph:
      "Aby zapewnić działanie platformy Esteo, korzystamy z usług sprawdzonych dostawców technologicznych. Każdy z nich realizuje określoną funkcję niezbędną do świadczenia usługi, taką jak logowanie, płatności, hosting czy funkcje AI.",
    tableHeaders: ["Dostawca", "Kategoria", "Opis"],
    footnoteScope:
      "Niektórzy z powyższych dostawców mogą przetwarzać dane osobowe wyłącznie w zakresie niezbędnym do świadczenia swoich usług.",
    footnoteUpdates:
      "Lista dostawców może ulegać zmianie wraz z rozwojem platformy i będzie na bieżąco aktualizowana.",
  },
  en: {
    pageTitle: "Service providers",
    pageDescription: "Which external services Esteo uses and for what purpose.",
    breadcrumbLabel: "Service providers",
    introParagraph:
      "To operate the Esteo platform, we use trusted technology providers. Each performs a specific function necessary to deliver the service, such as sign-in, payments, hosting, or AI features.",
    tableHeaders: ["Provider", "Category", "Description"],
    footnoteScope:
      "Some of the providers above may process personal data only to the extent necessary to deliver their services.",
    footnoteUpdates:
      "The provider list may change as the platform evolves and will be kept up to date.",
  },
};

export const aiPolicyCopy: Record<
  Locale,
  {
    whenAiNotUsedParagraph: string;
    noBusinessDecisionsParagraph: string;
    howAiWorksParagraph: string;
    whenDataSentParagraph: string;
    whatDataMayBeUsedParagraph: string;
    noTrainingParagraph: string;
    trustedPartnersLine: string;
    professionalJudgmentParagraph: string;
    modelUpdatesParagraph: string;
    privacyPolicyReference: string;
    aiPolicyPathReference: string;
  }
> = {
  pl: {
    whenAiNotUsedParagraph:
      "Nie każda funkcja Esteo wykorzystuje sztuczną inteligencję. AI jest uruchamiana wyłącznie w miejscach wyraźnie oznaczonych jako funkcje AI.",
    noBusinessDecisionsParagraph:
      "AI nie podejmuje decyzji biznesowych w imieniu użytkownika.",
    howAiWorksParagraph:
      "AI analizuje informacje przekazane przez użytkownika lub klienta i proponuje projekt kosztorysu. Wygenerowany wynik ma charakter pomocniczy i wymaga weryfikacji.",
    whenDataSentParagraph:
      "Dane są przekazywane do modelu AI wyłącznie podczas korzystania z funkcji wykorzystujących sztuczną inteligencję.",
    whatDataMayBeUsedParagraph:
      "Mogą zostać przekazane informacje niezbędne do wykonania żądania, takie jak opis prac, treść zapytania, nazwy pozycji kosztorysu lub inne dane wybrane przez użytkownika.",
    noTrainingParagraph:
      "Nie wykorzystujemy danych wycen użytkowników do trenowania publicznych modeli AI.",
    trustedPartnersLine: "Korzystamy z modeli AI dostarczanych przez zaufanych partnerów.",
    professionalJudgmentParagraph:
      "Wyniki AI nie zastępują wiedzy zawodowej ani doświadczenia użytkownika.",
    modelUpdatesParagraph:
      "Modele AI wykorzystywane przez Esteo mogą ulegać zmianom wraz z rozwojem platformy.",
    privacyPolicyReference: "Szczegóły przetwarzania danych opisuje Polityka prywatności.",
    aiPolicyPathReference: "Szczegóły w dokumencie AI i odpowiedzialność.",
  },
  en: {
    whenAiNotUsedParagraph:
      "Not every Esteo feature uses artificial intelligence. AI runs only in areas clearly marked as AI features.",
    noBusinessDecisionsParagraph: "AI does not make business decisions on your behalf.",
    howAiWorksParagraph:
      "AI analyzes information provided by you or your client and proposes an estimate draft. The generated result is assistive and requires verification.",
    whenDataSentParagraph:
      "Data is sent to an AI model only when you use features that rely on artificial intelligence.",
    whatDataMayBeUsedParagraph:
      "Information necessary to fulfill the request may be sent, such as work descriptions, request content, estimate line names, or other data you choose to provide.",
    noTrainingParagraph: "We do not use user estimate data to train public AI models.",
    trustedPartnersLine: "We use AI models delivered by trusted partners.",
    professionalJudgmentParagraph:
      "AI results do not replace your professional knowledge or experience.",
    modelUpdatesParagraph: "AI models used by Esteo may change as the platform evolves.",
    privacyPolicyReference: "See the Privacy Policy for data processing details.",
    aiPolicyPathReference: "See the AI & Responsibility document for details.",
  },
};

export const termsDefinitions: Record<Locale, { term: string; definition: string }[]> = {
  pl: [
    {
      term: "Esteo",
      definition: "Platforma SaaS do tworzenia wycen i kosztorysów dla firm usługowych.",
    },
    { term: "Workspace", definition: "Przestrzeń robocza użytkownika lub zespołu w Esteo." },
    { term: "Użytkownik", definition: "Osoba korzystająca z konta Esteo." },
    {
      term: "Właściciel Workspace",
      definition: "Użytkownik zarządzający workspace, planem i członkami.",
    },
    { term: "Subskrypcja", definition: "Płatny dostęp do planu w modelu abonamentowym." },
    { term: "Usługa", definition: "Funkcjonalności Esteo dostępne w ramach konta." },
  ],
  en: [
    {
      term: "Esteo",
      definition: "A SaaS platform for creating estimates and quotes for service companies.",
    },
    { term: "Workspace", definition: "A user or team workspace within Esteo." },
    { term: "User", definition: "A person using an Esteo account." },
    {
      term: "Workspace owner",
      definition: "The user who manages the workspace, plan, and members.",
    },
    { term: "Subscription", definition: "Paid access to a plan on a recurring basis." },
    { term: "Service", definition: "Esteo features available under your account." },
  ],
};

export function formatServiceProviderParagraphs(locale: Locale): string[] {
  return serviceProviders[locale].map(
    (provider) =>
      `${provider.name} (${getServiceProviderCategoryLabel(locale, provider.category)}) — ${provider.description}`,
  );
}

export function formatDefinitionParagraphs(locale: Locale): string[] {
  return termsDefinitions[locale].map((entry) => `${entry.term} — ${entry.definition}`);
}

export function getSubprocessorTableRows(locale: Locale): string[][] {
  return serviceProviders[locale].map((provider) => [
    provider.name,
    getServiceProviderCategoryLabel(locale, provider.category),
    provider.description,
  ]);
}
