import type { AvatarPreset } from "@/components/avatars/user-avatar";
import type { Currency } from "@/i18n/formatters";

export type DashboardActivityFeedItem = {
  id: string;
  actorName: string;
  isCurrentUser: boolean;
  kind: "document_added" | "request_completed" | "estimate_sent";
  documentName?: string;
  requestTitle?: string;
  estimateTitle?: string;
  workspaceName?: string;
  occurredAt: string;
  actor: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
    avatarPreset: AvatarPreset | null;
  };
};

export type DashboardDocumentFileType = "PDF" | "DOCX" | "XLSX" | "PPTX";

export type DashboardRecentDocumentItem = {
  id: string;
  fileName: string;
  fileType: DashboardDocumentFileType;
  workspaceName: string;
  fileSizeBytes: number;
  occurredAt: string;
};

export type DashboardOverduePaymentItem = {
  id: string;
  estimateId: string;
  estimateTitle: string;
  dueDate: string;
  amount: number;
  currency: Currency;
  customerName: string | null;
};

export type DashboardInsightsData = {
  recentActivity: DashboardActivityFeedItem[];
  recentDocuments: DashboardRecentDocumentItem[];
  overduePayments: DashboardOverduePaymentItem[];
};
