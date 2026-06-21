import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Check,
  Info,
  Loader2,
  PartyPopper,
  Send,
  X,
} from "lucide-react";

export type AppToastVariant =
  | "success"
  | "info"
  | "warning"
  | "error"
  | "celebration"
  | "action"
  | "loading";

export type AppToastAction = {
  label: string;
  onClick: () => void;
};

export type AppToastVariantConfig = {
  icon: LucideIcon;
  iconClassName: string;
  iconWrapClassName: string;
  borderClassName: string;
  accentClassName: string;
  primaryButtonClassName: string;
  secondaryActionClassName: string;
  spinIcon?: boolean;
};

export const APP_TOAST_VARIANTS: Record<AppToastVariant, AppToastVariantConfig> = {
  success: {
    icon: Check,
    iconClassName: "text-emerald-600 dark:text-emerald-400",
    iconWrapClassName:
      "bg-emerald-500/15 ring-1 ring-emerald-500/25 dark:bg-emerald-400/15 dark:ring-emerald-400/20",
    borderClassName: "border-emerald-500/20 dark:border-emerald-400/15",
    accentClassName: "bg-emerald-500 dark:bg-emerald-400",
    primaryButtonClassName:
      "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400",
    secondaryActionClassName:
      "text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300",
  },
  info: {
    icon: Info,
    iconClassName: "text-blue-600 dark:text-blue-400",
    iconWrapClassName:
      "bg-blue-500/15 ring-1 ring-blue-500/25 dark:bg-blue-400/15 dark:ring-blue-400/20",
    borderClassName: "border-blue-500/20 dark:border-blue-400/15",
    accentClassName: "bg-blue-500 dark:bg-blue-400",
    primaryButtonClassName:
      "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400",
    secondaryActionClassName:
      "text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-amber-600 dark:text-amber-400",
    iconWrapClassName:
      "bg-amber-500/15 ring-1 ring-amber-500/25 dark:bg-amber-400/15 dark:ring-amber-400/20",
    borderClassName: "border-amber-500/20 dark:border-amber-400/15",
    accentClassName: "bg-amber-500 dark:bg-amber-400",
    primaryButtonClassName:
      "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300",
    secondaryActionClassName:
      "text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300",
  },
  error: {
    icon: X,
    iconClassName: "text-red-600 dark:text-red-400",
    iconWrapClassName:
      "bg-red-500/15 ring-1 ring-red-500/25 dark:bg-red-400/15 dark:ring-red-400/20",
    borderClassName: "border-red-500/20 dark:border-red-400/15",
    accentClassName: "bg-red-500 dark:bg-red-400",
    primaryButtonClassName:
      "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400",
    secondaryActionClassName:
      "text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300",
  },
  celebration: {
    icon: PartyPopper,
    iconClassName: "text-violet-600 dark:text-violet-400",
    iconWrapClassName:
      "bg-violet-500/15 ring-1 ring-violet-500/25 dark:bg-violet-400/15 dark:ring-violet-400/20",
    borderClassName: "border-violet-500/20 dark:border-violet-400/15",
    accentClassName: "bg-violet-500 dark:bg-violet-400",
    primaryButtonClassName:
      "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400",
    secondaryActionClassName:
      "text-violet-700 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300",
  },
  action: {
    icon: Send,
    iconClassName: "text-teal-600 dark:text-teal-400",
    iconWrapClassName:
      "bg-teal-500/15 ring-1 ring-teal-500/25 dark:bg-teal-400/15 dark:ring-teal-400/20",
    borderClassName: "border-teal-500/20 dark:border-teal-400/15",
    accentClassName: "bg-teal-500 dark:bg-teal-400",
    primaryButtonClassName:
      "bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400",
    secondaryActionClassName:
      "text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300",
  },
  loading: {
    icon: Loader2,
    iconClassName: "text-blue-600 dark:text-blue-400",
    iconWrapClassName:
      "bg-blue-500/15 ring-1 ring-blue-500/25 dark:bg-blue-400/15 dark:ring-blue-400/20",
    borderClassName: "border-blue-500/20 dark:border-blue-400/15",
    accentClassName: "bg-blue-500 dark:bg-blue-400",
    primaryButtonClassName:
      "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400",
    secondaryActionClassName:
      "text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
    spinIcon: true,
  },
};
