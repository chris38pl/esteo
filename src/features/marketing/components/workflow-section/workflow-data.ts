import type { Locale } from "@/lib/locale";

export const WORKFLOW_AUTOPLAY_MS = 6000;

/** Per-step autoplay durations. */
export const WORKFLOW_STEP_DURATIONS_MS = [6000, 8200, 21000, 10000, 15000] as const;

export function getWorkflowStepDuration(stepIndex: number): number {
  return WORKFLOW_STEP_DURATIONS_MS[stepIndex] ?? WORKFLOW_AUTOPLAY_MS;
}

export type WorkflowStep = {
  id: number;
  title: string;
  description: string;
};

const WORKFLOW_STEPS_PL: WorkflowStep[] = [
  {
    id: 0,
    title: "Zapytanie klienta",
    description:
      "Klient wypełnia Twój dedykowany formularz kontaktowy — przesyła zdjęcia i wymagania.",
  },
  {
    id: 1,
    title: "AI tworzy szkic",
    description: "AI analizuje dane i przygotowuje pierwszy kosztorys.",
  },
  {
    id: 2,
    title: "Edycja kosztorysu i wysyłka PDF",
    description: "Zweryfikuj pozycje, poproś AI o zmiany i wyślij dokument do klienta.",
  },
  {
    id: 3,
    title: "Odbiór wyceny przez klienta",
    description: "Klient otrzymuje e-mail z profesjonalnym PDF w załączniku.",
  },
  {
    id: 4,
    title: "Potwierdzenie i płatność",
    description: "Klient akceptuje wycenę, a Ty śledzisz zaliczki w harmonogramie płatności.",
  },
];

const WORKFLOW_STEPS_EN: WorkflowStep[] = [
  {
    id: 0,
    title: "Client request",
    description:
      "The client fills out your dedicated contact form — with photos and requirements.",
  },
  {
    id: 1,
    title: "AI creates a draft",
    description: "AI analyzes the data and prepares the first estimate.",
  },
  {
    id: 2,
    title: "Edit estimate and send PDF",
    description: "Review line items, ask AI for changes, and send the document to the client.",
  },
  {
    id: 3,
    title: "Client receives the estimate",
    description: "The client gets an email with a professional PDF attached.",
  },
  {
    id: 4,
    title: "Confirmation and payment",
    description: "The client accepts the estimate and you track installments in the payment schedule.",
  },
];

export const WORKFLOW_STEP_COUNT = WORKFLOW_STEPS_PL.length;

export type WorkflowContent = {
  title: string;
  titleLine2: string;
  description: string;
  steps: WorkflowStep[];
  demoLabel: string;
};

export type WorkflowDemoCopy = {
  request: {
    formTitle: string;
    clientLabel: string;
    clientValue: string;
    descriptionLabel: string;
    descriptionValue: string;
    uploadLabel: string;
    submit: string;
    submitting: string;
    success: string;
  };
  ai: {
    generating: string;
    progress: string;
    sectionA: string;
    sectionB: string;
    total: string;
    ready: string;
  };
  editor: {
    estimateTitle: string;
    itemLabel: string;
    itemValue: string;
    totalLabel: string;
    userMessage: string;
    assistantReply: string;
    updatedItem: string;
  };
  pdfExport: {
    title: string;
    generate: string;
    generating: string;
    success: string;
    sending: string;
    emailSent: string;
  };
  delivery: {
    inboxLabel: string;
    emailFrom: string;
    emailSubject: string;
    emailPreview: string;
    emailSent: string;
    emailRecipient: string;
    emailTimeShort: string;
    emailBodyGreeting: string;
    emailBodyMain: string;
    emailBodyFollowUp: string;
    emailSignOff: string;
    newMessage: string;
    favoritesLabel: string;
    sentFolder: string;
    draftsFolder: string;
    deletedFolder: string;
    spamFolder: string;
    focusedTab: string;
    otherTab: string;
    reply: string;
    forward: string;
    websiteUrl: string;
    sentLabel: string;
    attachmentName: string;
    openAttachment: string;
    completed: string;
    success: string;
  };
};

export function getWorkflowContent(locale: Locale): WorkflowContent {
  return locale === "pl"
    ? {
        title: "Od zapytania klienta",
        titleLine2: "do profesjonalnego PDF w kilka minut.",
        description: "Zobacz jak wygląda cały proces pracy w Esteo.",
        demoLabel: "Interaktywny podgląd produktu",
        steps: WORKFLOW_STEPS_PL,
      }
    : {
        title: "From client inquiry",
        titleLine2: "to a professional PDF in minutes.",
        description: "See how the full Esteo workflow works.",
        demoLabel: "Interactive product preview",
        steps: WORKFLOW_STEPS_EN,
      };
}

export function getWorkflowDemoCopy(locale: Locale): WorkflowDemoCopy {
  return locale === "pl"
    ? {
        request: {
          formTitle: "Nowe zapytanie",
          clientLabel: "Klient",
          clientValue: "Anna Kowalska",
          descriptionLabel: "Opis prac",
          descriptionValue: "Remont łazienki 8 m², wymiana armatury.",
          uploadLabel: "Zdjęcia",
          submit: "Wyślij zapytanie",
          submitting: "Wysyłanie…",
          success: "Zapytanie wysłane",
        },
        ai: {
          generating: "AI tworzy kosztorys…",
          progress: "Analiza zapytania",
          sectionA: "Roboty przygotowawcze",
          sectionB: "Wykończenie łazienki",
          total: "Razem brutto",
          ready: "Szkic gotowy",
        },
        editor: {
          estimateTitle: "Kosztorys — Łazienka",
          itemLabel: "2.1 Prysznic walk-in",
          itemValue: "4 200 zł",
          totalLabel: "Suma brutto",
          userMessage: "Dodaj wannę zamiast prysznica.",
          assistantReply: "Zaktualizowałem pozycję i przeliczyłem sumę.",
          updatedItem: "2.1 Wanna wolnostojąca",
        },
        pdfExport: {
          title: "Eksport dokumentu",
          generate: "Generuj PDF",
          generating: "Generowanie…",
          success: "PDF gotowy",
          sending: "Wysyłanie do klienta…",
          emailSent: "Wysłano na adres klienta",
        },
        delivery: {
          inboxLabel: "Odebrane",
          emailFrom: "Esteo Dev Workspace",
          emailSubject: "Wycena mieszkania — Mariusz Kowalski",
          emailPreview:
            "Dzień dobry, w załączniku przesyłam przygotowaną wycenę. W razie pytań pozostaję do dyspozycji.",
          emailSent: "Dziś, 14:32",
          emailRecipient: "Mariusz Kowalski",
          emailTimeShort: "14:32",
          emailBodyGreeting: "Dzień dobry,",
          emailBodyMain: "w załączniku przesyłam przygotowaną wycenę.",
          emailBodyFollowUp: "W razie pytań pozostaję do dyspozycji.",
          emailSignOff: "Pozdrawiam,",
          newMessage: "Nowa wiadomość",
          favoritesLabel: "Ulubione",
          sentFolder: "Wysłane",
          draftsFolder: "Wersje robocze",
          deletedFolder: "Usunięte",
          spamFolder: "Spam",
          focusedTab: "Priorytetowe",
          otherTab: "Inne",
          reply: "Odpowiedz",
          forward: "Prześlij dalej",
          websiteUrl: "www.esteo.app",
          sentLabel: "Do:",
          attachmentName: "wycena-ER-2026-00008.pdf",
          openAttachment: "Otwórz załącznik",
          completed: "Profesjonalna wycena w rękach klienta",
          success: "PDF otwarty",
        },
      }
    : {
        request: {
          formTitle: "New request",
          clientLabel: "Client",
          clientValue: "Anna Kowalska",
          descriptionLabel: "Scope of work",
          descriptionValue: "Bathroom renovation 8 m², fixture replacement.",
          uploadLabel: "Photos",
          submit: "Submit request",
          submitting: "Sending…",
          success: "Request submitted",
        },
        ai: {
          generating: "AI is building the estimate…",
          progress: "Analyzing request",
          sectionA: "Preparatory work",
          sectionB: "Bathroom finishing",
          total: "Gross total",
          ready: "Draft ready",
        },
        editor: {
          estimateTitle: "Estimate — Bathroom",
          itemLabel: "2.1 Walk-in shower",
          itemValue: "€980",
          totalLabel: "Gross total",
          userMessage: "Add a bathtub instead of the shower.",
          assistantReply: "I updated the line item and recalculated the total.",
          updatedItem: "2.1 Freestanding bathtub",
        },
        pdfExport: {
          title: "Document export",
          generate: "Generate PDF",
          generating: "Generating…",
          success: "PDF ready",
          sending: "Sending to client…",
          emailSent: "Sent to the client",
        },
        delivery: {
          inboxLabel: "Inbox",
          emailFrom: "Esteo Dev Workspace",
          emailSubject: "Apartment estimate — Mariusz Kowalski",
          emailPreview:
            "Hello, please find the prepared estimate attached. Let me know if you have any questions.",
          emailSent: "Today, 2:32 PM",
          emailRecipient: "Mariusz Kowalski",
          emailTimeShort: "2:32 PM",
          emailBodyGreeting: "Hello,",
          emailBodyMain: "please find the prepared estimate attached.",
          emailBodyFollowUp: "Let me know if you have any questions.",
          emailSignOff: "Best regards,",
          newMessage: "New message",
          favoritesLabel: "Favorites",
          sentFolder: "Sent",
          draftsFolder: "Drafts",
          deletedFolder: "Deleted",
          spamFolder: "Spam",
          focusedTab: "Focused",
          otherTab: "Other",
          reply: "Reply",
          forward: "Forward",
          websiteUrl: "www.esteo.app",
          sentLabel: "To:",
          attachmentName: "estimate-ER-2026-00008.pdf",
          openAttachment: "Open attachment",
          completed: "A professional estimate in the client's hands",
          success: "PDF opened",
        },
      };
}
