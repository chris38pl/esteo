import type { Locale } from "@/lib/locale";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalPageContent = {
  pageTitle: string;
  pageDescription: string;
  lastUpdated: string;
  draftNotice: string;
  sections: LegalSection[];
};

const draftNotice: Record<Locale, string> = {
  pl: "Wersja robocza - dokument wymaga przeglądu prawnego przed publikacją produkcyjną.",
  en: "Draft version - this document requires legal review before production publication.",
};

export const privacyContent: Record<Locale, LegalPageContent> = {
  pl: {
    pageTitle: "Polityka prywatności",
    pageDescription: "Jak Esteo przetwarza dane osobowe użytkowników i klientów workspace.",
    lastUpdated: "30 czerwca 2026",
    draftNotice: draftNotice.pl,
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
    lastUpdated: "June 30, 2026",
    draftNotice: draftNotice.en,
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
    lastUpdated: "30 czerwca 2026",
    draftNotice: draftNotice.pl,
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
          "Usługa świadczona jest w modelu SaaS „as is” w zakresie dozwolonym prawem.",
          "Odpowiedzialność operatora jest ograniczona zgodnie z obowiązującymi przepisami.",
        ],
      },
    ],
  },
  en: {
    pageTitle: "Terms of Service",
    pageDescription: "Terms of use for the Esteo app and workspace subscriptions.",
    lastUpdated: "June 30, 2026",
    draftNotice: draftNotice.en,
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
          "The service is provided as SaaS “as is” to the extent permitted by law.",
          "The operator’s liability is limited as permitted by applicable law.",
        ],
      },
    ],
  },
};

export const cookiesContent: Record<Locale, LegalPageContent> = {
  pl: {
    pageTitle: "Polityka cookies",
    pageDescription: "Informacje o plikach cookies i podobnych technologiach w Esteo.",
    lastUpdated: "30 czerwca 2026",
    draftNotice: draftNotice.pl,
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
          "Przed załadowaniem nieistotnych cookies analitycznych planujemy baner zgody zgodny z tą polityką.",
          "Możesz też zarządzać cookies w ustawieniach przeglądarki.",
        ],
      },
    ],
  },
  en: {
    pageTitle: "Cookie Policy",
    pageDescription: "Information about cookies and similar technologies in Esteo.",
    lastUpdated: "June 30, 2026",
    draftNotice: draftNotice.en,
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
          "Before loading non-essential analytics cookies we plan a consent banner aligned with this policy.",
          "You can also manage cookies in your browser settings.",
        ],
      },
    ],
  },
};

export const aiDisclaimerContent: Record<Locale, LegalPageContent> = {
  pl: {
    pageTitle: "AI Disclaimer",
    pageDescription: "Zasady korzystania z funkcji AI w Esteo i odpowiedzialność użytkownika.",
    lastUpdated: "30 czerwca 2026",
    draftNotice: draftNotice.pl,
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
    pageDescription: "Rules for using AI features in Esteo and user responsibility.",
    lastUpdated: "June 30, 2026",
    draftNotice: draftNotice.en,
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
