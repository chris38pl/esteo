import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type TrustPoint = {
  id: string;
  title: string;
  description: string;
};

export type TrustPromiseAccent = "blue" | "teal" | "purple";

export type TrustPromise = {
  id: string;
  title: string;
  description: string;
  iconSrc: string;
  accent: TrustPromiseAccent;
};

export type TrustTechnologyProvider = {
  id: string;
  name: string;
  description: string;
};

export type TrustDocLink = {
  id: string;
  label: string;
  description: string;
  href: string;
  accent: TrustPromiseAccent;
};

export type TrustHubCardItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type LegalHighlightCard = {
  title: string;
  description?: string;
};

export type LegalChecklistItem = {
  text: string;
};

export type LegalPrincipleRow = {
  title: string;
  description: string;
};

export type LegalSummaryVariant =
  | { type: "cards"; items: LegalHighlightCard[] }
  | { type: "checklist"; items: LegalChecklistItem[] }
  | { type: "principles"; items: LegalPrincipleRow[] };

export type TrustDetailTab = {
  id: string;
  label: string;
  panel: ReactNode;
};
