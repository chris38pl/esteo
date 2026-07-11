import type { Locale } from "@/lib/locale";

import type { LegalSummaryVariant } from "@/features/marketing/components/trust-center/trust-types";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalPageContent = {
  pageTitle: string;
  pageDescription: string;
  pageTitleUI?: string;
  pageSubtitle?: string;
  breadcrumbLabel: string;
  lastUpdated: string;
  documentVersion: string;
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

export const privacyContent: Record<Locale, LegalPageContent> = {
  pl: {
    pageTitle: "Polityka prywatności",
    pageDescription: "Jak Esteo przetwarza dane osobowe użytkowników i klientów workspace.",
    breadcrumbLabel: "Polityka prywatności",
    lastUpdated: "30 czerwca 2026",
    documentVersion: "1.0",
    draftNotice: draftNotice.pl,
    fullDocumentLabel: fullDocumentLabel.pl,
    summary: {
      type: "cards",
      items: [
        { title: "Nie sprzedajemy danych" },
        {
          title: "Twoje wyceny nie są wykorzystywane do trenowania publicznych modeli AI.",
        },
        { title: "Zaufani dostawcy", description: "Clerk, Stripe i infrastruktura chmurowa." },
        { title: "Możesz usunąć konto", description: "Skontaktuj się z nami w sprawie usunięcia danych." },
        { title: "Kontakt", description: "support@esteo.app" },
      ],
    },
    sections: [
      {
        title: "Administrator danych",
        paragraphs: [
          "Administratorem danych osobowych przetwarzanych w związku z korzystaniem z Esteo jest operator aplikacji wskazany w Regulaminie.",
          "Kontakt w sprawach prywatności: support@esteo.app.",
        ],
      },
      {
        title: "Jakie dane przetwarzamy",
        paragraphs: [
          "Dane konta (np. e-mail, identyfikator użytkownika), dane workspace, zapytania i wyceny wprowadzane przez użytkowników oraz dane rozliczeniowe obsługiwane przez Stripe.",
          "Nie zbieramy więcej danych niż potrzeba do świadczenia usługi, wsparcia i rozliczeń.",
        ],
      },
      {
        title: "Cele i podstawy przetwarzania",
        paragraphs: [
          "Świadczenie usługi, obsługa konta, rozliczenia, bezpieczeństwo i wsparcie - na podstawie umowy lub prawnie uzasadnionego interesu administratora.",
          "Marketing bezpośredni tylko za zgodą, jeśli będzie stosowany.",
        ],
      },
      {
        title: "Odbiorcy danych",
        paragraphs: [
          "Korzystamy m.in. z Clerk (uwierzytelnianie), Stripe (płatności) oraz dostawców hostingu i infrastruktury chmurowej.",
          "Dane nie są sprzedawane podmiotom trzecim.",
        ],
      },
      {
        title: "Prawa użytkownika",
        paragraphs: [
          "Przysługują Ci prawa dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz sprzeciwu - w granicach prawa.",
          "Skargę możesz złożyć do organu nadzorczego (PUODO).",
        ],
      },
    ],
  },
  en: {
    pageTitle: "Privacy Policy",
    pageDescription: "How Esteo processes personal data of users and workspace customers.",
    breadcrumbLabel: "Privacy Policy",
    lastUpdated: "June 30, 2026",
    documentVersion: "1.0",
    draftNotice: draftNotice.en,
    fullDocumentLabel: fullDocumentLabel.en,
    summary: {
      type: "cards",
      items: [
        { title: "We do not sell your data" },
        { title: "Your estimates are not used to train public AI models." },
        { title: "Trusted providers", description: "Clerk, Stripe, and cloud infrastructure." },
        { title: "You can delete your account", description: "Contact us to request data deletion." },
        { title: "Contact", description: "support@esteo.app" },
      ],
    },
    sections: [
      {
        title: "Data controller",
        paragraphs: [
          "The controller of personal data processed in connection with Esteo is the app operator identified in the Terms of Service.",
          "Privacy contact: support@esteo.app.",
        ],
      },
      {
        title: "What data we process",
        paragraphs: [
          "Account data (e.g. email, user identifier), workspace data, requests and estimates entered by users, and billing data handled by Stripe.",
          "We do not collect more data than needed to provide the service, support, and billing.",
        ],
      },
      {
        title: "Purposes and legal bases",
        paragraphs: [
          "Providing the service, account management, billing, security, and support - based on contract or legitimate interest.",
          "Direct marketing only with consent, if used.",
        ],
      },
      {
        title: "Data recipients",
        paragraphs: [
          "We use providers including Clerk (authentication), Stripe (payments), and cloud hosting infrastructure.",
          "Data is not sold to third parties.",
        ],
      },
      {
        title: "Your rights",
        paragraphs: [
          "You may have rights of access, rectification, erasure, restriction, portability, and objection - as applicable under law.",
          "You may lodge a complaint with your supervisory authority.",
        ],
      },
    ],
  },
};

export const termsContent: Record<Locale, LegalPageContent> = {
  pl: {
    pageTitle: "Regulamin",
    pageDescription: "Warunki korzystania z aplikacji Esteo i subskrypcji workspace.",
    breadcrumbLabel: "Regulamin",
    lastUpdated: "30 czerwca 2026",
    documentVersion: "1.0",
    draftNotice: draftNotice.pl,
    fullDocumentLabel: fullDocumentLabel.pl,
    summary: {
      type: "checklist",
      items: [
        { text: "Esteo pomaga tworzyć kosztorysy i wyceny" },
        { text: "AI generuje szkice - Ty weryfikujesz treść" },
        { text: "Ty odpowiadasz za wysyłane wyceny do klientów" },
        { text: "Subskrypcję można anulować w ustawieniach rozliczeń" },
        { text: "Działa jako subskrypcja" },
      ],
    },
    sections: [
      {
        title: "Postanowienia ogólne",
        paragraphs: [
          "Regulamin określa zasady korzystania z Esteo - platformy do przygotowywania wycen i kosztorysów dla firm usługowych.",
          "Korzystanie z usługi oznacza akceptację Regulaminu.",
        ],
      },
      {
        title: "Konto i workspace",
        paragraphs: [
          "Użytkownik zakłada konto i tworzy workspace. Właściciel workspace zarządza planem, członkami i rozliczeniami.",
          "Użytkownik odpowiada za treści wprowadzane do workspace, w tym wyceny wysyłane do klientów.",
        ],
      },
      {
        title: "Plany i płatności",
        paragraphs: [
          "Szczegóły planów i limitów opisuje cennik. Płatności obsługuje Stripe.",
          "Subskrypcję można anulować zgodnie z ustawieniami rozliczeń; dostęp do płatnych funkcji trwa do końca opłaconego okresu, o ile prawo nie stanowi inaczej.",
        ],
      },
      {
        title: "AI i treści",
        paragraphs: [
          "Funkcje AI generują szkice. Użytkownik zobowiązany jest do weryfikacji treści przed wysłaniem do klienta.",
          "Esteo nie gwarantuje dokładności szacunków AI.",
        ],
      },
      {
        title: "Odpowiedzialność",
        paragraphs: [
          "Usługa świadczona jest w modelu subskrypcji „as is” w zakresie dozwolonym prawem.",
          "Odpowiedzialność operatora jest ograniczona zgodnie z obowiązującymi przepisami.",
        ],
      },
    ],
  },
  en: {
    pageTitle: "Terms of Service",
    pageDescription: "Terms of use for the Esteo app and workspace subscriptions.",
    breadcrumbLabel: "Terms of Service",
    lastUpdated: "June 30, 2026",
    documentVersion: "1.0",
    draftNotice: draftNotice.en,
    fullDocumentLabel: fullDocumentLabel.en,
    summary: {
      type: "checklist",
      items: [
        { text: "Esteo helps you create estimates and quotes" },
        { text: "AI generates drafts - you verify the content" },
        { text: "You are responsible for estimates sent to clients" },
        { text: "You can cancel your subscription in billing settings" },
        { text: "Works as a subscription" },
      ],
    },
    sections: [
      {
        title: "General",
        paragraphs: [
          "These terms govern use of Esteo - a platform for preparing estimates and quotes for service companies.",
          "Using the service means you accept these terms.",
        ],
      },
      {
        title: "Account and workspace",
        paragraphs: [
          "You create an account and workspace. The workspace owner manages the plan, members, and billing.",
          "You are responsible for content entered into the workspace, including estimates sent to clients.",
        ],
      },
      {
        title: "Plans and payments",
        paragraphs: [
          "Plan details and limits are described on the pricing page. Payments are handled by Stripe.",
          "You may cancel the subscription in billing settings; paid feature access continues until the end of the paid period unless law requires otherwise.",
        ],
      },
      {
        title: "AI and content",
        paragraphs: [
          "AI features generate drafts. You must verify content before sending it to a client.",
          "Esteo does not guarantee the accuracy of AI suggestions.",
        ],
      },
      {
        title: "Liability",
        paragraphs: [
          "The service is provided as a subscription “as is” to the extent permitted by law.",
          "The operator's liability is limited as permitted by applicable law.",
        ],
      },
    ],
  },
};

export const cookiesContent: Record<Locale, LegalPageContent> = {
  pl: {
    pageTitle: "Polityka cookies",
    pageDescription: "Informacje o plikach cookies i podobnych technologiach w Esteo.",
    breadcrumbLabel: "Cookies",
    lastUpdated: "30 czerwca 2026",
    documentVersion: "1.0",
    draftNotice: draftNotice.pl,
    fullDocumentLabel: fullDocumentLabel.pl,
    summary: {
      type: "cards",
      items: [
        { title: "Niezbędne cookies", description: "Logowanie, bezpieczeństwo, podstawowe działanie aplikacji." },
        { title: "Funkcjonalne", description: "Np. zapamiętanie języka interfejsu." },
        { title: "Analityka tylko po zgodzie", description: "Zewnętrzna analityka tylko za Twoją zgodą." },
        { title: "Baner zgody na cookies", description: "Wyświetlamy baner zgodny z tą polityką." },
        { title: "Brak reklam", description: "Nie sprzedajemy danych reklamodawcom." },
        { title: "Możesz wyłączyć cookies w swojej przeglądarce" },
      ],
    },
    sections: [
      {
        title: "Czym są cookies",
        paragraphs: [
          "Cookies to małe pliki zapisywane w przeglądarce. Używamy ich m.in. do utrzymania sesji, preferencji języka i - po uzyskaniu zgody - analityki.",
        ],
      },
      {
        title: "Rodzaje cookies",
        paragraphs: [
          "Niezbędne: logowanie, bezpieczeństwo, podstawowe działanie aplikacji.",
          "Funkcjonalne: np. zapamiętanie locale.",
          "Analityczne (opcjonalne): tylko po zgodzie użytkownika, gdy wdrożymy zewnętrznego dostawcę analityki.",
        ],
      },
      {
        title: "Zarządzanie zgodą",
        paragraphs: [
          "Wyświetlamy baner zgody na cookies zgodny z tą polityką.",
          "Możesz też zarządzać cookies w ustawieniach przeglądarki.",
        ],
      },
    ],
  },
  en: {
    pageTitle: "Cookie Policy",
    pageDescription: "Information about cookies and similar technologies in Esteo.",
    breadcrumbLabel: "Cookies",
    lastUpdated: "June 30, 2026",
    documentVersion: "1.0",
    draftNotice: draftNotice.en,
    fullDocumentLabel: fullDocumentLabel.en,
    summary: {
      type: "cards",
      items: [
        { title: "Essential cookies", description: "Sign-in, security, core app functionality." },
        { title: "Functional", description: "E.g. remembering interface language." },
        { title: "Analytics only with consent", description: "External analytics only with your consent." },
        { title: "Cookie consent banner", description: "We display a banner aligned with this policy." },
        { title: "No ads", description: "We do not sell data to advertisers." },
        { title: "You can disable cookies in your browser" },
      ],
    },
    sections: [
      {
        title: "What cookies are",
        paragraphs: [
          "Cookies are small files stored in your browser. We use them for session, language preferences, and - with consent - analytics.",
        ],
      },
      {
        title: "Types of cookies",
        paragraphs: [
          "Essential: sign-in, security, core app functionality.",
          "Functional: e.g. remembering locale.",
          "Analytics (optional): only after user consent when an external analytics vendor is enabled.",
        ],
      },
      {
        title: "Managing consent",
        paragraphs: [
          "We display a cookie consent banner aligned with this policy.",
          "You can also manage cookies in your browser settings.",
        ],
      },
    ],
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
    lastUpdated: "30 czerwca 2026",
    documentVersion: "1.0",
    draftNotice: draftNotice.pl,
    fullDocumentLabel: fullDocumentLabel.pl,
    summary: {
      type: "principles",
      items: [
        {
          title: "AI przygotowuje szkic",
          description: "Funkcje AI generują punkt startu kosztorysu - nie gotowy dokument do wysłania.",
        },
        {
          title: "Ostateczna decyzja należy do Ciebie",
          description: "Ty weryfikujesz pozycje, ceny i opisy przed wysłaniem wyceny do klienta.",
        },
        {
          title: "Zawsze zweryfikuj wycenę",
          description: "Sprawdź każdą wycenę przed wysłaniem - niezależnie od tego, czy AI pomagała w jej przygotowaniu.",
        },
        {
          title: "Brak gwarancji dokładności",
          description: "Modele AI mogą się mylić. Esteo nie gwarantuje poprawności szacunków.",
        },
        {
          title: "Dane i modele",
          description: "Nie wykorzystujemy danych wycen do trenowania publicznych modeli AI.",
        },
      ],
    },
    sections: [
      {
        title: "Szkic, nie decyzja",
        paragraphs: [
          "AI w Esteo przygotowuje szkic kosztorysu na podstawie informacji od użytkownika lub klienta. To punkt startu, nie gotowy dokument do wysłania bez przeglądu.",
        ],
      },
      {
        title: "Obowiązek weryfikacji",
        paragraphs: [
          "Użytkownik musi sprawdzić pozycje, ceny, jednostki i opisy przed wysłaniem wyceny do klienta. Odpowiedzialność za finalną treść ponosi użytkownik.",
        ],
      },
      {
        title: "Brak gwarancji dokładności",
        paragraphs: [
          "Modele AI mogą się mylić lub pomijać kontekst branżowy. Esteo nie gwarantuje poprawności szacunków ani zgodności z przepisami branżowymi.",
        ],
      },
      {
        title: "Dane i modele",
        paragraphs: [
          "Nie wykorzystujemy danych wycen użytkowników do trenowania publicznych modeli. Szczegóły w Polityce prywatności.",
        ],
      },
    ],
  },
  en: {
    pageTitle: "AI Disclaimer",
    pageTitleUI: "AI & Responsibility",
    pageDescription: "Rules for using AI features in Esteo.",
    pageSubtitle:
      "Learn how Esteo uses AI and which responsibilities remain with you as the user.",
    breadcrumbLabel: "AI & Responsibility",
    lastUpdated: "June 30, 2026",
    documentVersion: "1.0",
    draftNotice: draftNotice.en,
    fullDocumentLabel: fullDocumentLabel.en,
    summary: {
      type: "principles",
      items: [
        {
          title: "AI prepares a draft",
          description: "AI features generate a starting point for an estimate - not a final document to send.",
        },
        {
          title: "The final decision is yours",
          description: "You verify line items, prices, and descriptions before sending an estimate to a client.",
        },
        {
          title: "Always verify the estimate",
          description: "Review every estimate before sending it - whether or not AI helped prepare it.",
        },
        {
          title: "No accuracy guarantee",
          description: "AI models can be wrong. Esteo does not guarantee estimate accuracy.",
        },
        {
          title: "Data and models",
          description: "We do not use estimate data to train public AI models.",
        },
      ],
    },
    sections: [
      {
        title: "Draft, not a decision",
        paragraphs: [
          "AI in Esteo prepares an estimate draft from information provided by you or your client. It is a starting point, not a final document to send without review.",
        ],
      },
      {
        title: "Duty to verify",
        paragraphs: [
          "You must check line items, prices, units, and descriptions before sending an estimate to a client. You are responsible for the final content.",
        ],
      },
      {
        title: "No accuracy guarantee",
        paragraphs: [
          "AI models can be wrong or miss industry context. Esteo does not guarantee estimate accuracy or regulatory compliance.",
        ],
      },
      {
        title: "Data and models",
        paragraphs: [
          "We do not use user estimate data to train public models. See the Privacy Policy for details.",
        ],
      },
    ],
  },
};
