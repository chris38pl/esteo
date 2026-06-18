import type { DashboardInsightsData } from "@/features/dashboard/lib/dashboard-overview-types";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

export function getDashboardPlaceholderInsights(): DashboardInsightsData {
  return {
    requestsChart: {
      total: 12,
      trendPercent: 20,
      bars: [
        { label: "mon", value: 10 },
        { label: "tue", value: 8 },
        { label: "wed", value: 16 },
        { label: "thu", value: 12 },
        { label: "fri", value: 14 },
        { label: "sat", value: 5 },
        { label: "sun", value: 7 },
      ],
    },
    incomeChart: {
      total: 24_600,
      trendPercent: 12,
      bars: [
        { label: "mon", value: 3_200 },
        { label: "tue", value: 4_100 },
        { label: "wed", value: 2_800 },
        { label: "thu", value: 5_200 },
        { label: "fri", value: 4_800 },
        { label: "sat", value: 1_900 },
        { label: "sun", value: 2_600 },
      ],
    },
    recentActivity: [
      {
        id: "act-1",
        actorName: "Anna Kowalska",
        isCurrentUser: false,
        kind: "document_added",
        documentName: "Analiza techniczna.docx",
        workspaceName: "Projekty budowlane",
        occurredAt: hoursAgo(5),
        actor: {
          name: "Anna Kowalska",
          email: "anna@example.com",
          avatarUrl: null,
          avatarPreset: "architect",
        },
      },
      {
        id: "act-2",
        actorName: "Piotr Nowak",
        isCurrentUser: false,
        kind: "request_completed",
        requestTitle: "Porównanie kosztów materiałów",
        occurredAt: hoursAgo(7),
        actor: {
          name: "Piotr Nowak",
          email: "piotr@example.com",
          avatarUrl: null,
          avatarPreset: "engineer",
        },
      },
      {
        id: "act-3",
        actorName: "Ty",
        isCurrentUser: true,
        kind: "document_added",
        documentName: "Oferta inwestycyjna.pdf",
        workspaceName: "Przestrzeń główna",
        occurredAt: daysAgo(2),
        actor: {
          name: "Ty",
          email: "you@example.com",
          avatarUrl: null,
          avatarPreset: "constructor",
        },
      },
      {
        id: "act-4",
        actorName: "Marta Wiśniewska",
        isCurrentUser: false,
        kind: "estimate_sent",
        estimateTitle: "Remont łazienki — wersja 2",
        occurredAt: daysAgo(3),
        actor: {
          name: "Marta Wiśniewska",
          email: "marta@example.com",
          avatarUrl: null,
          avatarPreset: "electrician",
        },
      },
      {
        id: "act-5",
        actorName: "Jan Kowalczyk",
        isCurrentUser: false,
        kind: "document_added",
        documentName: "Kosztorys_Q2_2024.xlsx",
        workspaceName: "Finanse",
        occurredAt: daysAgo(4),
        actor: {
          name: "Jan Kowalczyk",
          email: "jan@example.com",
          avatarUrl: null,
          avatarPreset: "accountant",
        },
      },
    ],
    recentDocuments: [
      {
        id: "doc-1",
        fileName: "Oferta inwestycyjna.pdf",
        fileType: "PDF",
        workspaceName: "Przestrzeń główna",
        fileSizeBytes: 2_516_582,
        occurredAt: hoursAgo(2),
      },
      {
        id: "doc-2",
        fileName: "Analiza techniczna.docx",
        fileType: "DOCX",
        workspaceName: "Projekty budowlane",
        fileSizeBytes: 1_782_336,
        occurredAt: hoursAgo(5),
      },
      {
        id: "doc-3",
        fileName: "Kosztorys_Q2_2024.xlsx",
        fileType: "XLSX",
        workspaceName: "Finanse",
        fileSizeBytes: 3_251_840,
        occurredAt: daysAgo(1),
      },
      {
        id: "doc-4",
        fileName: "Prezentacja_mieszkanie.pptx",
        fileType: "PPTX",
        workspaceName: "Mieszkanie",
        fileSizeBytes: 6_502_400,
        occurredAt: daysAgo(3),
      },
    ],
    overduePayments: [
      {
        id: "pay-1",
        estimateId: "est-1",
        estimateTitle: "Remont łazienki — etap I",
        dueDate: daysAgo(12),
        amount: 12_480,
        currency: "PLN",
        customerName: "Anna Kowalska",
      },
      {
        id: "pay-2",
        estimateId: "est-2",
        estimateTitle: "Instalacja fotowoltaiki",
        dueDate: daysAgo(5),
        amount: 9_637.8,
        currency: "PLN",
        customerName: "Piotr Nowak",
      },
      {
        id: "pay-3",
        estimateId: "est-3",
        estimateTitle: "Malowanie biura — faktura końcowa",
        dueDate: daysAgo(2),
        amount: 6_000,
        currency: "PLN",
        customerName: "Studio Architektura Sp. z o.o.",
      },
    ],
  };
}
