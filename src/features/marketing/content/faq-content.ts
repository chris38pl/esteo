import type { Locale } from "@/lib/locale";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqContent = {
  eyebrow: string;
  titleBefore: string;
  titleHighlight: string;
  description: string;
  cta: string;
  teaserItems: FaqItem[];
  allItems: FaqItem[];
};

const faqContent: Record<Locale, FaqContent> = {
  pl: {
    eyebrow: "FAQ",
    titleBefore: "Najczęstsze pytania ",
    titleHighlight: "przed startem",
    description:
      "Krótkie odpowiedzi o AI, edycji wycen, PDF i planach. Pełną listę znajdziesz na stronie FAQ.",
    cta: "Pełne FAQ",
    teaserItems: [
      {
        id: "ai_final_estimate",
        question: "Czy AI samo tworzy finalną wycenę?",
        answer:
          "Nie. AI przygotowuje szkic kosztorysu na podstawie zapytania klienta. Ty przeglądasz, edytujesz pozycje i dopiero wtedy wysyłasz dokument do klienta.",
      },
      {
        id: "edit_before_send",
        question: "Czy mogę edytować wycenę przed wysłaniem?",
        answer:
          "Tak. Każda pozycja, cena i opis są w pełni edytowalne. Esteo wspiera przygotowanie wyceny, ale ostateczna decyzja należy do Ciebie.",
      },
      {
        id: "export_pdf",
        question: "Czy mogę wyeksportować PDF?",
        answer:
          "Tak. Gotowy kosztorys możesz wyeksportować do profesjonalnego PDF z brandingiem workspace i wysłać klientowi e-mailem lub pobrać lokalnie.",
      },
      {
        id: "ai_training_data",
        question: "Czy moje dane są używane do trenowania modeli AI?",
        answer:
          "Nie wykorzystujemy Twoich danych projektowych ani wycen do trenowania publicznych modeli. Szczegóły opisujemy w Polityce prywatności i na stronie AI.",
      },
      {
        id: "free_plan",
        question: "Co obejmuje plan darmowy?",
        answer:
          "Plan FREE pozwala przetestować workflow: zapytania, szkic AI, edycję i podstawowe limity workspace. Pełne porównanie planów znajdziesz w cenniku.",
      },
      {
        id: "cancel_paid",
        question: "Czy mogę anulować płatny plan?",
        answer:
          "Tak. Subskrypcję możesz zarządzać w ustawieniach rozliczeń workspace. Zasady anulowania i rozliczeń opisujemy w Regulaminie.",
      },
    ],
    allItems: [],
  },
  en: {
    eyebrow: "FAQ",
    titleBefore: "Common questions ",
    titleHighlight: "before you start",
    description:
      "Short answers about AI, editing estimates, PDF export, and plans. See the full FAQ page for more.",
    cta: "Full FAQ",
    teaserItems: [
      {
        id: "ai_final_estimate",
        question: "Can AI create the final estimate automatically?",
        answer:
          "No. AI prepares a draft estimate from the customer request. You review, edit line items, and only then send the document to the client.",
      },
      {
        id: "edit_before_send",
        question: "Can I edit the estimate before sending?",
        answer:
          "Yes. Every line item, price, and description is fully editable. Esteo helps you prepare the estimate, but the final decision is yours.",
      },
      {
        id: "export_pdf",
        question: "Can I export a PDF?",
        answer:
          "Yes. You can export a professional branded PDF from your workspace and send it by email or download it locally.",
      },
      {
        id: "ai_training_data",
        question: "Is my data used to train AI models?",
        answer:
          "We do not use your project or estimate data to train public models. See our Privacy Policy and AI page for details.",
      },
      {
        id: "free_plan",
        question: "What is included in the free plan?",
        answer:
          "The FREE plan lets you test the workflow: requests, AI draft, editing, and basic workspace limits. Compare all plans on the pricing page.",
      },
      {
        id: "cancel_paid",
        question: "Can I cancel a paid plan?",
        answer:
          "Yes. You can manage the subscription in workspace billing settings. Cancellation and billing rules are described in the Terms of Service.",
      },
    ],
    allItems: [],
  },
};

const extraFaqItems: Record<Locale, FaqItem[]> = {
  pl: [
    {
      id: "workspace_billing",
      question: "Jak działa rozliczenie workspace?",
      answer:
        "Subskrypcja jest przypisana do workspace, nie do pojedynczego użytkownika. Właściciel workspace zarządza planem i rozliczeniami w panelu.",
    },
    {
      id: "support_contact",
      question: "Jak skontaktować się z supportem?",
      answer:
        "Napisz na support@esteo.app lub skorzystaj ze strony Kontakt. Odpowiadamy w dni robocze.",
    },
    {
      id: "data_security",
      question: "Gdzie przechowywane są moje dane?",
      answer:
        "Dane projektów i wycen są przechowywane w Twoim workspace w aplikacji. Więcej o bezpieczeństwie i dostawcach znajdziesz na stronie Bezpieczeństwo.",
    },
  ],
  en: [
    {
      id: "workspace_billing",
      question: "How does workspace billing work?",
      answer:
        "The subscription is tied to the workspace, not a single user. The workspace owner manages the plan and billing in the dashboard.",
    },
    {
      id: "support_contact",
      question: "How do I contact support?",
      answer:
        "Email support@esteo.app or use the Contact page. We respond on business days.",
    },
    {
      id: "data_security",
      question: "Where is my data stored?",
      answer:
        "Project and estimate data is stored in your workspace inside the app. See the Security page for more about providers and data handling.",
    },
  ],
};

export function getFaqContent(locale: Locale): FaqContent {
  const base = faqContent[locale];
  return {
    ...base,
    allItems: [...base.teaserItems, ...extraFaqItems[locale]],
  };
}
