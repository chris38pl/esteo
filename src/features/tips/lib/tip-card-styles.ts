import {
  ArrowRightLeft,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Eye,
  FileDown,
  FilePlus,
  FileText,
  Globe,
  Handshake,
  Image,
  Inbox,
  Layers,
  LifeBuoy,
  Mic,
  Pencil,
  Pin,
  Receipt,
  Search,
  Send,
  Share2,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  SunMoon,
  Undo2,
  UserPlus,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { TipId } from "@/features/tips/lib/tips-catalog";

export type TipCardStyle = {
  Icon: LucideIcon;
  badgeClassName: string;
  iconWrapClassName: string;
  iconClassName: string;
  linkClassName: string;
  categoryClassName: string;
};

type TipColor = "blue" | "violet" | "emerald" | "amber" | "rose" | "cyan" | "orange" | "indigo" | "teal" | "pink" | "sky" | "lime";

function tipStyle(Icon: LucideIcon, color: TipColor): TipCardStyle {
  const map: Record<TipColor, Omit<TipCardStyle, "Icon">> = {
    blue: {
      badgeClassName: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      iconWrapClassName:
        "bg-blue-500/12 ring-1 ring-blue-500/20 dark:bg-blue-400/10 dark:ring-blue-400/15",
      iconClassName: "text-blue-600 dark:text-blue-400",
      linkClassName:
        "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
      categoryClassName:
        "bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20 dark:text-blue-300 dark:ring-blue-400/15",
    },
    violet: {
      badgeClassName: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
      iconWrapClassName:
        "bg-violet-500/12 ring-1 ring-violet-500/20 dark:bg-violet-400/10 dark:ring-violet-400/15",
      iconClassName: "text-violet-600 dark:text-violet-400",
      linkClassName:
        "text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300",
      categoryClassName:
        "bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300 dark:ring-violet-400/15",
    },
    emerald: {
      badgeClassName: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      iconWrapClassName:
        "bg-emerald-500/12 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:ring-emerald-400/15",
      iconClassName: "text-emerald-600 dark:text-emerald-400",
      linkClassName:
        "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
      categoryClassName:
        "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/15",
    },
    amber: {
      badgeClassName: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      iconWrapClassName:
        "bg-amber-500/12 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:ring-amber-400/15",
      iconClassName: "text-amber-600 dark:text-amber-400",
      linkClassName:
        "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300",
      categoryClassName:
        "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300 dark:ring-amber-400/15",
    },
    rose: {
      badgeClassName: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      iconWrapClassName:
        "bg-rose-500/12 ring-1 ring-rose-500/20 dark:bg-rose-400/10 dark:ring-rose-400/15",
      iconClassName: "text-rose-600 dark:text-rose-400",
      linkClassName:
        "text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300",
      categoryClassName:
        "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-300 dark:ring-rose-400/15",
    },
    cyan: {
      badgeClassName: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
      iconWrapClassName:
        "bg-cyan-500/12 ring-1 ring-cyan-500/20 dark:bg-cyan-400/10 dark:ring-cyan-400/15",
      iconClassName: "text-cyan-600 dark:text-cyan-400",
      linkClassName:
        "text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300",
      categoryClassName:
        "bg-cyan-500/10 text-cyan-700 ring-1 ring-cyan-500/20 dark:text-cyan-300 dark:ring-cyan-400/15",
    },
    orange: {
      badgeClassName: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
      iconWrapClassName:
        "bg-orange-500/12 ring-1 ring-orange-500/20 dark:bg-orange-400/10 dark:ring-orange-400/15",
      iconClassName: "text-orange-600 dark:text-orange-400",
      linkClassName:
        "text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300",
      categoryClassName:
        "bg-orange-500/10 text-orange-700 ring-1 ring-orange-500/20 dark:text-orange-300 dark:ring-orange-400/15",
    },
    indigo: {
      badgeClassName: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
      iconWrapClassName:
        "bg-indigo-500/12 ring-1 ring-indigo-500/20 dark:bg-indigo-400/10 dark:ring-indigo-400/15",
      iconClassName: "text-indigo-600 dark:text-indigo-400",
      linkClassName:
        "text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300",
      categoryClassName:
        "bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-500/20 dark:text-indigo-300 dark:ring-indigo-400/15",
    },
    teal: {
      badgeClassName: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
      iconWrapClassName:
        "bg-teal-500/12 ring-1 ring-teal-500/20 dark:bg-teal-400/10 dark:ring-teal-400/15",
      iconClassName: "text-teal-600 dark:text-teal-400",
      linkClassName:
        "text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300",
      categoryClassName:
        "bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/20 dark:text-teal-300 dark:ring-teal-400/15",
    },
    pink: {
      badgeClassName: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
      iconWrapClassName:
        "bg-pink-500/12 ring-1 ring-pink-500/20 dark:bg-pink-400/10 dark:ring-pink-400/15",
      iconClassName: "text-pink-600 dark:text-pink-400",
      linkClassName:
        "text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300",
      categoryClassName:
        "bg-pink-500/10 text-pink-700 ring-1 ring-pink-500/20 dark:text-pink-300 dark:ring-pink-400/15",
    },
    sky: {
      badgeClassName: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
      iconWrapClassName:
        "bg-sky-500/12 ring-1 ring-sky-500/20 dark:bg-sky-400/10 dark:ring-sky-400/15",
      iconClassName: "text-sky-600 dark:text-sky-400",
      linkClassName:
        "text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300",
      categoryClassName:
        "bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300 dark:ring-sky-400/15",
    },
    lime: {
      badgeClassName: "bg-lime-500/15 text-lime-600 dark:text-lime-400",
      iconWrapClassName:
        "bg-lime-500/12 ring-1 ring-lime-500/20 dark:bg-lime-400/10 dark:ring-lime-400/15",
      iconClassName: "text-lime-600 dark:text-lime-400",
      linkClassName:
        "text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300",
      categoryClassName:
        "bg-lime-500/10 text-lime-700 ring-1 ring-lime-500/20 dark:text-lime-300 dark:ring-lime-400/15",
    },
  };

  return { Icon, ...map[color] };
}

export const TIP_CARD_STYLES: Record<TipId, TipCardStyle> = {
  first_estimate_steps: tipStyle(FilePlus, "blue"),
  voice_create_estimate: tipStyle(Mic, "violet"),
  review_ai_before_send: tipStyle(ClipboardCheck, "emerald"),
  find_save_pdf: tipStyle(FileDown, "amber"),
  client_sent_inquiry: tipStyle(Inbox, "rose"),
  share_form_link: tipStyle(Share2, "cyan"),
  preview_client_form: tipStyle(Eye, "orange"),
  fill_company_data: tipStyle(Building2, "indigo"),
  edit_one_line: tipStyle(Pencil, "teal"),
  ai_chat_plain_language: tipStyle(Sparkles, "pink"),
  payment_deposit: tipStyle(Wallet, "sky"),
  track_overdue_payments: tipStyle(CalendarClock, "lime"),
  quick_search: tipStyle(Search, "blue"),
  pin_important_estimate: tipStyle(Pin, "violet"),
  client_photos: tipStyle(Image, "emerald"),
  undo_mistake: tipStyle(Undo2, "amber"),
  what_is_workspace: tipStyle(Boxes, "rose"),
  use_on_phone: tipStyle(Smartphone, "cyan"),
  report_problem: tipStyle(LifeBuoy, "orange"),
  send_estimate: tipStyle(Send, "blue"),
  logo_pdf: tipStyle(FileText, "violet"),
  form_website: tipStyle(Globe, "emerald"),
  upgrade_plan: tipStyle(Zap, "amber"),
  customize_rules: tipStyle(SlidersHorizontal, "rose"),
  company_description: tipStyle(Building2, "cyan"),
  workspace_transfer: tipStyle(ArrowRightLeft, "orange"),
  partner_program: tipStyle(Handshake, "indigo"),
  estimate_modes: tipStyle(Layers, "teal"),
  browse_invoices: tipStyle(Receipt, "pink"),
  theme_switch: tipStyle(SunMoon, "sky"),
  invite_team: tipStyle(UserPlus, "lime"),
};
