import type { Locale } from "@/lib/locale";

import type { LegalSummaryVariant } from "@/features/marketing/components/trust-center/trust-types";
import {
  aiPolicyCopy,
  cookieCategoryRows,
  cookieConsentMvp,
  cookieProviderRows,
  formatDefinitionParagraphs,
  formatServiceProviderParagraphs,
  legalLastUpdated,
  legalOperatorConfig,
  legalOperatorCopy,
  privacyRetentionRows,
  termsDefinitions,
} from "@/features/marketing/content/legal.config";

export type LegalTable = {
  headers: string[];
  rows: string[][];
};

export type LegalSection = {
  title: string;
  paragraphs: string[];
  table?: LegalTable;
};

export type LegalPageContent = {
  pageTitle: string;
  pageDescription: string;
  pageTitleUI?: string;
  pageSubtitle?: string;
  breadcrumbLabel: string;
  lastUpdated: string;
  draftNotice: string;
  fullDocumentLabel: string;
  summary: LegalSummaryVariant;
  sections: LegalSection[];
};

const draftNotice: Record<Locale, string> = {
  pl: "Wersja robocza - dokument wymaga przeglądu prawnego przed publikacją produkcyjną.",
  en: "Draft version - this document requires legal review before production publication.",
};

const fullDocumentLabel: Record<Locale, string> = {
  pl: "Pełny dokument",
  en: "Full document",
};

function buildPrivacySections(locale: Locale): LegalSection[] {
  const copy = legalOperatorCopy[locale];
  const ai = aiPolicyCopy[locale];
  const retentionIntro =
    locale === "pl"
      ? "Poniżej ogólne zasady — szczegóły mogą zależeć od ustawień konta i obowiązujących przepisów."
      : "Below are general rules — details may depend on account settings and applicable law.";

  return locale === "pl"
    ? [
        {
          title: "Administrator danych",
          paragraphs: [copy.dataControllerParagraph, copy.mvpDocumentNote, copy.privacyContactLine],
        },
        {
          title: "Jakie dane zbieramy",
          paragraphs: [
            "Dane konta (np. e-mail, identyfikator użytkownika), dane workspace, zapytania i wyceny wprowadzane przez użytkowników, załączniki oraz dane rozliczeniowe obsługiwane przez Stripe.",
            "Nie zbieramy więcej danych niż potrzeba do świadczenia usługi, wsparcia i rozliczeń.",
          ],
        },
        {
          title: "W jakim celu wykorzystujemy dane",
          paragraphs: [
            "Świadczenie usługi, obsługa konta, rozliczenia, bezpieczeństwo i wsparcie — na podstawie umowy lub prawnie uzasadnionego interesu administratora.",
            "Marketing bezpośredni tylko za zgodą, jeśli będzie stosowany.",
          ],
        },
        {
          title: "Dostawcy usług i podmioty przetwarzające",
          paragraphs: [
            "Esteo korzysta z zaufanych dostawców zewnętrznych; każdy przetwarza dane wyłącznie w zakresie niezbędnym do świadczenia usługi.",
            ...formatServiceProviderParagraphs(locale),
            "Pełna lista dostawców: /legal/subprocessors.",
            "Dane nie są sprzedawane podmiotom trzecim.",
          ],
        },
        {
          title: "AI i przetwarzanie danych",
          paragraphs: [
            "Jeżeli korzystasz z funkcji AI, treść zapytania oraz dane niezbędne do wygenerowania odpowiedzi mogą zostać przekazane dostawcy modelu AI.",
            ai.noTrainingParagraph,
            ai.aiPolicyPathReference,
          ],
        },
        {
          title: "Okres przechowywania danych",
          paragraphs: [retentionIntro],
          table: {
            headers: ["Kategoria", "Przechowywanie"],
            rows: privacyRetentionRows.pl.map((row) => [row.category, row.retention]),
          },
        },
        {
          title: "Transfer danych poza EOG",
          paragraphs: [
            "Niektórzy dostawcy usług mogą przetwarzać dane poza Europejskim Obszarem Gospodarczym. W takich przypadkach korzystamy wyłącznie z dostawców stosujących odpowiednie mechanizmy ochrony danych, zgodnie z obowiązującymi przepisami.",
          ],
        },
        {
          title: "Bezpieczeństwo danych",
          paragraphs: [
            copy.securityHttpsLine,
            "Stosujemy uwierzytelnianie i kontrolę dostępu do kont oraz workspace.",
            copy.securityBackupLine,
            "W celu zapewnienia bezpieczeństwa, diagnozowania problemów i stabilności usługi możemy przetwarzać logi systemowe obejmujące informacje o korzystaniu z aplikacji.",
          ],
        },
        {
          title: "Prawa użytkownika",
          paragraphs: [
            "Przysługują Ci prawa dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz sprzeciwu — w granicach prawa.",
            "Skargę możesz złożyć do organu nadzorczego (PUODO).",
          ],
        },
        {
          title: "Zmiany polityki",
          paragraphs: [
            "Polityka prywatności może być okresowo aktualizowana. O istotnych zmianach poinformujemy użytkowników poprzez aplikację lub pocztę elektroniczną.",
          ],
        },
        {
          title: "Kontakt",
          paragraphs: [
            `W sprawach dotyczących danych osobowych napisz na ${legalOperatorConfig.email}.`,
          ],
        },
      ]
    : [
        {
          title: "Data controller",
          paragraphs: [copy.dataControllerParagraph, copy.mvpDocumentNote, copy.privacyContactLine],
        },
        {
          title: "What data we collect",
          paragraphs: [
            "Account data (e.g. email, user identifier), workspace data, requests and estimates entered by users, attachments, and billing data handled by Stripe.",
            "We do not collect more data than needed to provide the service, support, and billing.",
          ],
        },
        {
          title: "Why we use data",
          paragraphs: [
            "Providing the service, account management, billing, security, and support — based on contract or legitimate interest.",
            "Direct marketing only with consent, if used.",
          ],
        },
        {
          title: "Service providers and subprocessors",
          paragraphs: [
            "Esteo uses trusted external providers; each processes data only to the extent necessary to deliver the service.",
            ...formatServiceProviderParagraphs(locale),
            "Full provider list: /legal/subprocessors.",
            "Data is not sold to third parties.",
          ],
        },
        {
          title: "AI data processing",
          paragraphs: [
            "If you use AI features, request content and data necessary to generate a response may be sent to an AI model provider.",
            ai.noTrainingParagraph,
            ai.aiPolicyPathReference,
          ],
        },
        {
          title: "Data retention",
          paragraphs: [retentionIntro],
          table: {
            headers: ["Category", "Retention"],
            rows: privacyRetentionRows.en.map((row) => [row.category, row.retention]),
          },
        },
        {
          title: "International data transfers",
          paragraphs: [
            "Some service providers may process data outside the European Economic Area. In such cases, we use providers that apply appropriate data protection safeguards as required by applicable law.",
          ],
        },
        {
          title: "Data security",
          paragraphs: [
            copy.securityHttpsLine,
            "We use authentication and access controls for accounts and workspaces.",
            copy.securityBackupLine,
            "We may process system logs covering app usage for security, diagnostics, and service stability.",
          ],
        },
        {
          title: "Your rights",
          paragraphs: [
            "You may have rights of access, rectification, erasure, restriction, portability, and objection — as applicable under law.",
            "You may lodge a complaint with your supervisory authority.",
          ],
        },
        {
          title: "Policy updates",
          paragraphs: [
            "This Privacy Policy may be updated from time to time. We will inform users of material changes via the app or email.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [`For personal data matters, email ${legalOperatorConfig.email}.`],
        },
      ];
}

function buildTermsSections(locale: Locale): LegalSection[] {
  const copy = legalOperatorCopy[locale];
  const ai = aiPolicyCopy[locale];
  const pricingRef = locale === "pl" ? "aktualny cennik" : "current pricing page";
  const aiDocRef = locale === "pl" ? "AI i odpowiedzialność" : "AI & Responsibility";

  return locale === "pl"
    ? [
        {
          title: "Postanowienia ogólne",
          paragraphs: [
            "Regulamin określa zasady korzystania z Esteo — platformy do przygotowywania wycen i kosztorysów dla firm usługowych.",
            "Korzystanie z usługi oznacza akceptację Regulaminu.",
            copy.mvpDocumentNote,
            copy.b2bAudienceParagraph,
          ],
        },
        {
          title: "Definicje",
          paragraphs: formatDefinitionParagraphs(locale),
        },
        {
          title: "Konto użytkownika",
          paragraphs: [
            "Użytkownik zakłada konto i podaje prawdziwe dane kontaktowe.",
            "Użytkownik odpowiada za bezpieczeństwo swojego konta, nie udostępnia danych logowania i odpowiada za działania wykonane z jego konta.",
          ],
        },
        {
          title: "Workspace i członkowie",
          paragraphs: [
            "Użytkownik może utworzyć workspace. Właściciel workspace zarządza planem, członkami i rozliczeniami.",
            "Właściciel może zapraszać i usuwać członków workspace oraz odpowiada za zarządzanie workspace.",
            "Użytkownik odpowiada za treści wprowadzane do workspace, w tym wyceny wysyłane do klientów.",
          ],
        },
        {
          title: "Plany, subskrypcje i limity",
          paragraphs: [
            `Szczegóły planów, funkcji i limitów opisuje ${pricingRef}. Funkcje i limity zależą od planu, mogą się różnić i ulec zmianie.`,
            "Płatności obsługuje Stripe. Subskrypcję można anulować w ustawieniach rozliczeń; dostęp do płatnych funkcji trwa do końca opłaconego okresu, o ile prawo nie stanowi inaczej.",
          ],
        },
        {
          title: "Dane użytkownika",
          paragraphs: [
            "Kosztorysy, wyceny, załączniki i dane klientów wprowadzane do Esteo pozostają własnością użytkownika.",
            "Esteo nie nabywa praw własności do tych treści; uzyskuje wyłącznie prawa niezbędne do świadczenia usługi.",
            "Użytkownik odpowiada za treści wprowadzane do workspace oraz za legalność materiałów dodawanych do workspace.",
          ],
        },
        {
          title: "AI i generowane treści",
          paragraphs: [
            "Funkcje AI generują szkice. Użytkownik zobowiązany jest do weryfikacji treści przed wysłaniem do klienta.",
            "Esteo nie gwarantuje dokładności szacunków AI.",
            `Szczegóły: ${aiDocRef} (/legal/ai).`,
          ],
        },
        {
          title: "Licencja i własność intelektualna",
          paragraphs: [
            "Użytkownik otrzymuje niewyłączną, nieprzenoszalną, odwoływalną licencję na korzystanie z aplikacji w ramach Regulaminu i wybranego planu.",
            "Esteo i jego elementy (oprogramowanie, marka, interfejs) pozostają własnością podmiotu świadczącego usługę.",
          ],
        },
        {
          title: "Odpowiedzialność",
          paragraphs: [
            "Usługa świadczona jest w modelu subskrypcji „as is” w zakresie dozwolonym prawem.",
            copy.serviceProviderLiabilityLine,
          ],
        },
        {
          title: "Zawieszenie i zakończenie korzystania z usługi",
          paragraphs: [
            "Dostęp może zostać zawieszony lub ograniczony, gdy użytkownik narusza Regulamin, podejmuje działania zagrażające bezpieczeństwu systemu lub wykorzystuje aplikację niezgodnie z przeznaczeniem.",
            "Użytkownik może zakończyć korzystanie przez usunięcie konta zgodnie z funkcjami aplikacji.",
          ],
        },
        {
          title: "Zmiany regulaminu",
          paragraphs: [
            "Regulamin może być okresowo aktualizowany. O istotnych zmianach poinformujemy użytkowników z odpowiednim wyprzedzeniem poprzez aplikację lub pocztę elektroniczną.",
          ],
        },
        {
          title: "Kontakt i reklamacje",
          paragraphs: [
            `Pytania i reklamacje: ${legalOperatorConfig.email}. Odpowiadamy w dni robocze.`,
          ],
        },
      ]
    : [
        {
          title: "General",
          paragraphs: [
            "These terms govern use of Esteo — a platform for preparing estimates and quotes for service companies.",
            "Using the service means you accept these terms.",
            copy.mvpDocumentNote,
            copy.b2bAudienceParagraph,
          ],
        },
        {
          title: "Definitions",
          paragraphs: formatDefinitionParagraphs(locale),
        },
        {
          title: "User account",
          paragraphs: [
            "You create an account and provide accurate contact details.",
            "You are responsible for account security, must not share login credentials, and are responsible for actions taken from your account.",
          ],
        },
        {
          title: "Workspace and members",
          paragraphs: [
            "You may create a workspace. The workspace owner manages the plan, members, and billing.",
            "The owner may invite and remove workspace members and is responsible for managing the workspace.",
            "You are responsible for content entered into the workspace, including estimates sent to clients.",
          ],
        },
        {
          title: "Plans, subscriptions, and limits",
          paragraphs: [
            `Plan features and limits are described on the ${pricingRef}. Features and limits depend on your plan, may differ, and may change.`,
            "Payments are handled by Stripe. You may cancel in billing settings; paid feature access continues until the end of the paid period unless law requires otherwise.",
          ],
        },
        {
          title: "User data",
          paragraphs: [
            "Estimates, quotes, attachments, and client data you enter into Esteo remain your property.",
            "Esteo does not acquire ownership of that content; it receives only the rights necessary to provide the service.",
            "You are responsible for content you enter and for the legality of materials added to your workspace.",
          ],
        },
        {
          title: "AI and generated content",
          paragraphs: [
            "AI features generate drafts. You must verify content before sending it to a client.",
            "Esteo does not guarantee the accuracy of AI suggestions.",
            `Details: ${aiDocRef} (/legal/ai).`,
          ],
        },
        {
          title: "License and intellectual property",
          paragraphs: [
            "You receive a non-exclusive, non-transferable, revocable license to use the app under these terms and your selected plan.",
            "Esteo and its components (software, brand, interface) remain the property of the service provider.",
          ],
        },
        {
          title: "Liability",
          paragraphs: [
            "The service is provided as a subscription “as is” to the extent permitted by law.",
            copy.serviceProviderLiabilityLine,
          ],
        },
        {
          title: "Suspension and termination",
          paragraphs: [
            "Access may be suspended or restricted if you violate these terms, threaten system security, or use the app contrary to its purpose.",
            "You may stop using the service by deleting your account through the app.",
          ],
        },
        {
          title: "Changes to these terms",
          paragraphs: [
            "These terms may be updated from time to time. We will notify users of material changes with reasonable notice via the app or email.",
          ],
        },
        {
          title: "Contact and complaints",
          paragraphs: [
            `Questions and complaints: ${legalOperatorConfig.email}. We respond on business days.`,
          ],
        },
      ];
}

function buildCookiesSections(locale: Locale): LegalSection[] {
  const categoryHeaders =
    locale === "pl"
      ? ["Kategoria", "Cel", "Wymagana zgoda"]
      : ["Category", "Purpose", "Consent required"];
  const providerHeaders =
    locale === "pl" ? ["Dostawca", "Cel"] : ["Provider", "Purpose"];

  const mvpAnalyticsNote =
    locale === "pl"
      ? "W obecnej wersji MVP Esteo wykorzystuje wyłącznie niezbędne i funkcjonalne cookies oraz cookies ustawiane przez Clerk i Stripe w zakresie niezbędnym do logowania i płatności. Narzędzia analityczne zewnętrzne nie są jeszcze aktywnie wdrożone — sekcja dotycząca cookies analitycznych i mechanizm zgody w banerze zaczną obowiązywać po ich uruchomieniu."
      : "In the current MVP, Esteo uses only essential and functional cookies plus cookies set by Clerk and Stripe as needed for sign-in and payments. External analytics tools are not yet active — the analytics section and consent banner will apply once those tools are enabled.";

  return locale === "pl"
    ? [
        {
          title: "Czym są cookies",
          paragraphs: [
            "Cookies to małe pliki zapisywane w przeglądarce. Używamy ich m.in. do utrzymania sesji, preferencji języka i — po uzyskaniu zgody — analityki.",
          ],
        },
        {
          title: "Kategorie cookies",
          paragraphs: [
            "Poniżej ogólne kategorie cookies używanych w Esteo. Nie prowadzimy listy poszczególnych plików cookies.",
          ],
          table: {
            headers: categoryHeaders,
            rows: cookieCategoryRows.pl.map((row) => [
              row.category,
              row.purpose,
              row.consentRequired,
            ]),
          },
        },
        {
          title: "Dostawcy cookies",
          paragraphs: ["Cookies mogą być ustawiane przez następujących dostawców:"],
          table: {
            headers: providerHeaders,
            rows: cookieProviderRows.pl.map((row) => [row.provider, row.purpose]),
          },
        },
        {
          title: "Czas przechowywania",
          paragraphs: [
            "Cookies sesyjne są usuwane po zakończeniu sesji przeglądarki. Cookies trwałe pozostają zapisane przez określony czas lub do momentu ich usunięcia przez użytkownika w ustawieniach przeglądarki.",
          ],
        },
        {
          title: "Podstawa prawna",
          paragraphs: [
            "Niezbędne pliki cookies są wykorzystywane w celu świadczenia usługi. Opcjonalne pliki cookies (np. analityczne) są wykorzystywane wyłącznie po uzyskaniu zgody użytkownika.",
          ],
        },
        {
          title: "Obecnie używane cookies (MVP)",
          paragraphs: [mvpAnalyticsNote],
        },
        {
          title: "Zarządzanie zgodą",
          paragraphs: [
            "Wyświetlamy baner zgody na cookies zgodny z tą polityką. Status zgody możesz sprawdzić i zmienić na górze tej strony oraz w stopce („Preferencje cookies”).",
            "Możesz też zarządzać cookies w ustawieniach przeglądarki.",
          ],
        },
      ]
    : [
        {
          title: "What cookies are",
          paragraphs: [
            "Cookies are small files stored in your browser. We use them for session, language preferences, and — with consent — analytics.",
          ],
        },
        {
          title: "Cookie categories",
          paragraphs: [
            "Below are the general cookie categories used in Esteo. We do not maintain a list of individual cookie names.",
          ],
          table: {
            headers: categoryHeaders,
            rows: cookieCategoryRows.en.map((row) => [
              row.category,
              row.purpose,
              row.consentRequired,
            ]),
          },
        },
        {
          title: "Cookie providers",
          paragraphs: ["Cookies may be set by the following providers:"],
          table: {
            headers: providerHeaders,
            rows: cookieProviderRows.en.map((row) => [row.provider, row.purpose]),
          },
        },
        {
          title: "Storage duration",
          paragraphs: [
            "Session cookies are removed when you close your browser. Persistent cookies remain for a set period or until you delete them in your browser settings.",
          ],
        },
        {
          title: "Legal basis",
          paragraphs: [
            "Essential cookies are used to provide the service. Optional cookies (e.g. analytics) are used only after you give consent.",
          ],
        },
        {
          title: "Cookies in use today (MVP)",
          paragraphs: [mvpAnalyticsNote],
        },
        {
          title: "Managing consent",
          paragraphs: [
            "We display a cookie consent banner aligned with this policy. You can review and change your choices at the top of this page and in the footer (“Cookie preferences”).",
            "You can also manage cookies in your browser settings.",
          ],
        },
      ];
}

function buildAiSections(locale: Locale): LegalSection[] {
  const ai = aiPolicyCopy[locale];

  return locale === "pl"
    ? [
        {
          title: "Czym jest AI w Esteo",
          paragraphs: [
            "AI w Esteo wykorzystuje sztuczną inteligencję jako pomoc przy tworzeniu kosztorysów — wynik ma charakter szkicu, nie gotowego dokumentu.",
            ai.whenAiNotUsedParagraph,
            ai.noBusinessDecisionsParagraph,
          ],
        },
        {
          title: "Jak działa AI",
          paragraphs: [ai.howAiWorksParagraph, ai.whenDataSentParagraph],
        },
        {
          title: "Jakie dane mogą zostać wykorzystane",
          paragraphs: [ai.whatDataMayBeUsedParagraph],
        },
        {
          title: "Jak chronimy dane",
          paragraphs: [ai.noTrainingParagraph, ai.trustedPartnersLine, ai.privacyPolicyReference],
        },
        {
          title: "Odpowiedzialność użytkownika",
          paragraphs: [
            "Użytkownik musi sprawdzić pozycje, ceny, jednostki i opisy przed wysłaniem wyceny do klienta. Odpowiedzialność za finalną treść ponosi użytkownik.",
          ],
        },
        {
          title: "Ograniczenia AI",
          paragraphs: [
            "Modele AI mogą się mylić lub pomijać kontekst branżowy. Esteo nie gwarantuje poprawności szacunków ani zgodności z przepisami branżowymi.",
            ai.professionalJudgmentParagraph,
          ],
        },
        {
          title: "Aktualizacje modeli",
          paragraphs: [ai.modelUpdatesParagraph],
        },
      ]
    : [
        {
          title: "What AI is in Esteo",
          paragraphs: [
            "AI in Esteo assists with creating estimates — the output is a draft, not a final document.",
            ai.whenAiNotUsedParagraph,
            ai.noBusinessDecisionsParagraph,
          ],
        },
        {
          title: "How AI works",
          paragraphs: [ai.howAiWorksParagraph, ai.whenDataSentParagraph],
        },
        {
          title: "What data may be used",
          paragraphs: [ai.whatDataMayBeUsedParagraph],
        },
        {
          title: "How we protect data",
          paragraphs: [ai.noTrainingParagraph, ai.trustedPartnersLine, ai.privacyPolicyReference],
        },
        {
          title: "Your responsibility",
          paragraphs: [
            "You must check line items, prices, units, and descriptions before sending an estimate to a client. You are responsible for the final content.",
          ],
        },
        {
          title: "Limitations of AI",
          paragraphs: [
            "AI models can be wrong or miss industry context. Esteo does not guarantee estimate accuracy or regulatory compliance.",
            ai.professionalJudgmentParagraph,
          ],
        },
        {
          title: "Model updates",
          paragraphs: [ai.modelUpdatesParagraph],
        },
      ];
}

export const privacyContent: Record<Locale, LegalPageContent> = {
  pl: {
    pageTitle: "Polityka prywatności",
    pageDescription: "Jak Esteo przetwarza dane osobowe użytkowników i klientów workspace.",
    pageSubtitle: "Jak przetwarzamy i chronimy Twoje dane.",
    breadcrumbLabel: "Polityka prywatności",
    lastUpdated: legalLastUpdated.pl,
    draftNotice: draftNotice.pl,
    fullDocumentLabel: fullDocumentLabel.pl,
    summary: {
      type: "cards",
      heading: "Najważniejsze informacje",
      layout: "grid-5",
      items: [
        {
          id: "no-sell",
          title: "Nie sprzedajemy danych",
          description:
            "Twoje dane nigdy nie są sprzedawane ani udostępniane serwisom trzecim w celach marketingowych.",
        },
        {
          id: "no-ai-training",
          title: "Nie wykorzystujemy danych do trenowania AI",
          description:
            "Nie używamy Twoich wycen, plików ani danych do trenowania publicznych modeli AI.",
        },
        {
          id: "providers",
          title: "Korzystamy z zaufanych dostawców",
          description:
            "Clerk, Stripe, Vercel, Neon, UploadThing i OpenAI — każdy w niezbędnym zakresie.",
        },
        {
          id: "delete-account",
          title: "Możesz usunąć swoje konto",
          description: "W każdej chwili możesz usunąć swoje konto i dane z aplikacji.",
        },
        {
          id: "contact",
          title: "Skontaktuj się z nami",
          description: `W sprawach dotyczących danych napisz do nas na ${legalOperatorConfig.email}`,
        },
      ],
    },
    sections: buildPrivacySections("pl"),
  },
  en: {
    pageTitle: "Privacy Policy",
    pageDescription: "How Esteo processes personal data of users and workspace customers.",
    pageSubtitle: "How we process and protect your data.",
    breadcrumbLabel: "Privacy Policy",
    lastUpdated: legalLastUpdated.en,
    draftNotice: draftNotice.en,
    fullDocumentLabel: fullDocumentLabel.en,
    summary: {
      type: "cards",
      heading: "Key information",
      layout: "grid-5",
      items: [
        {
          id: "no-sell",
          title: "We do not sell your data",
          description:
            "Your data is never sold or shared with third parties for marketing purposes.",
        },
        {
          id: "no-ai-training",
          title: "We do not use your data to train AI",
          description:
            "We do not use your estimates, files, or data to train public AI models.",
        },
        {
          id: "providers",
          title: "We use trusted providers",
          description:
            "Clerk, Stripe, Vercel, Neon, UploadThing, and OpenAI — each as needed.",
        },
        {
          id: "delete-account",
          title: "You can delete your account",
          description: "You can delete your account and data from the app at any time.",
        },
        {
          id: "contact",
          title: "Contact us",
          description: `For data-related matters, email us at ${legalOperatorConfig.email}`,
        },
      ],
    },
    sections: buildPrivacySections("en"),
  },
};

export const termsContent: Record<Locale, LegalPageContent> = {
  pl: {
    pageTitle: "Regulamin",
    pageDescription: "Warunki korzystania z aplikacji Esteo i subskrypcji workspace.",
    breadcrumbLabel: "Regulamin",
    lastUpdated: legalLastUpdated.pl,
    draftNotice: draftNotice.pl,
    fullDocumentLabel: fullDocumentLabel.pl,
    summary: {
      type: "checklist",
      imageSrc: "/images/marketing/legal/terms-summary.webp",
      imageAlt: "Podgląd kosztorysu w Esteo",
      items: [
        { text: "Esteo pomaga tworzyć kosztorysy i wyceny" },
        { text: "AI generuje szkice - Ty weryfikujesz treść" },
        { text: "Ty odpowiadasz za wysyłane wyceny do klientów" },
        { text: "Twoje kosztorysy i dane pozostają Twoją własnością" },
        { text: "Subskrypcję można anulować w ustawieniach rozliczeń" },
      ],
    },
    sections: buildTermsSections("pl"),
  },
  en: {
    pageTitle: "Terms of Service",
    pageDescription: "Terms of use for the Esteo app and workspace subscriptions.",
    breadcrumbLabel: "Terms of Service",
    lastUpdated: legalLastUpdated.en,
    draftNotice: draftNotice.en,
    fullDocumentLabel: fullDocumentLabel.en,
    summary: {
      type: "checklist",
      imageSrc: "/images/marketing/legal/terms-summary.webp",
      imageAlt: "Estimate preview in Esteo",
      items: [
        { text: "Esteo helps you create estimates and quotes" },
        { text: "AI generates drafts - you verify the content" },
        { text: "You are responsible for estimates sent to clients" },
        { text: "Your estimates and data remain your property" },
        { text: "You can cancel your subscription in billing settings" },
      ],
    },
    sections: buildTermsSections("en"),
  },
};

export const cookiesContent: Record<Locale, LegalPageContent> = {
  pl: {
    pageTitle: "Polityka cookies",
    pageDescription: "Informacje o plikach cookies i podobnych technologiach w Esteo.",
    breadcrumbLabel: "Cookies",
    lastUpdated: legalLastUpdated.pl,
    draftNotice: draftNotice.pl,
    fullDocumentLabel: fullDocumentLabel.pl,
    summary: {
      type: "cards",
      heading: "Najważniejsze informacje",
      layout: "grid-3",
      cardStyle: "highlight",
      items: [
        {
          id: "essential",
          title: "Niezbędne cookies",
          description: "Logowanie, bezpieczeństwo, podstawowe działanie aplikacji.",
        },
        {
          id: "functional",
          title: "Funkcjonalne",
          description: "Np. zapamiętanie języka interfejsu.",
        },
        {
          id: "analytics",
          title: "Analityka tylko po zgodzie",
          description: cookieConsentMvp.analyticsProviderEnabled
            ? "Zewnętrzna analityka tylko za Twoją zgodą."
            : "Przygotowane na przyszłe narzędzia — dziś nieaktywne.",
        },
        {
          id: "consent-banner",
          title: "Baner zgody na cookies",
          description: "Wyświetlamy baner zgodny z tą polityką.",
        },
        {
          id: "no-ads",
          title: "Brak reklam",
          description: "Nie sprzedajemy danych reklamodawcom.",
        },
        {
          id: "browser-settings",
          title: "Możesz wyłączyć cookies w swojej przeglądarce",
          description: "Ustawienia przeglądarki pozwalają ograniczyć lub usunąć cookies.",
        },
      ],
    },
    sections: buildCookiesSections("pl"),
  },
  en: {
    pageTitle: "Cookie Policy",
    pageDescription: "Information about cookies and similar technologies in Esteo.",
    breadcrumbLabel: "Cookies",
    lastUpdated: legalLastUpdated.en,
    draftNotice: draftNotice.en,
    fullDocumentLabel: fullDocumentLabel.en,
    summary: {
      type: "cards",
      heading: "Key information",
      layout: "grid-3",
      cardStyle: "highlight",
      items: [
        {
          id: "essential",
          title: "Essential cookies",
          description: "Sign-in, security, core app functionality.",
        },
        {
          id: "functional",
          title: "Functional",
          description: "E.g. remembering interface language.",
        },
        {
          id: "analytics",
          title: "Analytics only with consent",
          description: cookieConsentMvp.analyticsProviderEnabled
            ? "External analytics only with your consent."
            : "Prepared for future tools — not active today.",
        },
        {
          id: "consent-banner",
          title: "Cookie consent banner",
          description: "We display a banner aligned with this policy.",
        },
        {
          id: "no-ads",
          title: "No ads",
          description: "We do not sell data to advertisers.",
        },
        {
          id: "browser-settings",
          title: "You can disable cookies in your browser",
          description: "Your browser settings let you restrict or remove cookies.",
        },
      ],
    },
    sections: buildCookiesSections("en"),
  },
};

export const aiDisclaimerContent: Record<Locale, LegalPageContent> = {
  pl: {
    pageTitle: "AI Disclaimer",
    pageTitleUI: "AI i odpowiedzialność",
    pageDescription: "Zasady korzystania z funkcji AI w Esteo.",
    pageSubtitle:
      "Dowiedz się, jak Esteo wykorzystuje AI i jaka odpowiedzialność pozostaje po stronie użytkownika.",
    breadcrumbLabel: "AI i odpowiedzialność",
    lastUpdated: legalLastUpdated.pl,
    draftNotice: draftNotice.pl,
    fullDocumentLabel: fullDocumentLabel.pl,
    summary: {
      type: "cards",
      heading: "Najważniejsze informacje",
      layout: "grid-5",
      cardStyle: "highlight",
      items: [
        {
          id: "ai-draft",
          title: "AI przygotowuje szkic",
          description:
            "Funkcje AI generują punkt startu kosztorysu - nie gotowy dokument do wysłania.",
        },
        {
          id: "user-decision",
          title: "Ostateczna decyzja należy do Ciebie",
          description: "Ty weryfikujesz pozycje, ceny i opisy przed wysłaniem wyceny do klienta.",
        },
        {
          id: "verify",
          title: "Zawsze zweryfikuj wycenę",
          description:
            "Sprawdź każdą wycenę przed wysłaniem - niezależnie od tego, czy AI pomagała w jej przygotowaniu.",
        },
        {
          id: "no-guarantee",
          title: "Brak gwarancji dokładności",
          description: "Modele AI mogą się mylić. Esteo nie gwarantuje poprawności szacunków.",
        },
        {
          id: "data-models",
          title: "Dane i modele",
          description: "Nie wykorzystujemy danych wycen do trenowania publicznych modeli AI.",
        },
      ],
    },
    sections: buildAiSections("pl"),
  },
  en: {
    pageTitle: "AI Disclaimer",
    pageTitleUI: "AI & Responsibility",
    pageDescription: "Rules for using AI features in Esteo.",
    pageSubtitle:
      "Learn how Esteo uses AI and which responsibilities remain with you as the user.",
    breadcrumbLabel: "AI & Responsibility",
    lastUpdated: legalLastUpdated.en,
    draftNotice: draftNotice.en,
    fullDocumentLabel: fullDocumentLabel.en,
    summary: {
      type: "cards",
      heading: "Key information",
      layout: "grid-5",
      cardStyle: "highlight",
      items: [
        {
          id: "ai-draft",
          title: "AI prepares a draft",
          description:
            "AI features generate a starting point for an estimate - not a final document to send.",
        },
        {
          id: "user-decision",
          title: "The final decision is yours",
          description:
            "You verify line items, prices, and descriptions before sending an estimate to a client.",
        },
        {
          id: "verify",
          title: "Always verify the estimate",
          description:
            "Review every estimate before sending it - whether or not AI helped prepare it.",
        },
        {
          id: "no-guarantee",
          title: "No accuracy guarantee",
          description: "AI models can be wrong. Esteo does not guarantee estimate accuracy.",
        },
        {
          id: "data-models",
          title: "Data and models",
          description: "We do not use estimate data to train public AI models.",
        },
      ],
    },
    sections: buildAiSections("en"),
  },
};

// Re-export for consumers that need terms definitions
export { termsDefinitions };
