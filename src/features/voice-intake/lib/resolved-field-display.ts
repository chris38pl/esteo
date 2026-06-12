import {
  Calendar,
  ContactRound,
  Hammer,
  Home,
  Mail,
  MapPin,
  Phone,
  Ruler,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type ResolvedFieldFriendlyKey =
  | "propertyType"
  | "city"
  | "area"
  | "timeline"
  | "scope"
  | "contact"
  | "phone"
  | "email"
  | "fullName";

export const RESOLVED_FIELD_KEY_MAP: Record<string, ResolvedFieldFriendlyKey> = {
  propertyType: "propertyType",
  city: "city",
  area: "area",
  preferredStartDate: "timeline",
  scopeOfWork: "scope",
  contact: "contact",
  phone: "phone",
  email: "email",
  fullName: "fullName",
};

export const RESOLVED_FIELD_ICONS: Record<ResolvedFieldFriendlyKey, LucideIcon> = {
  propertyType: Home,
  city: MapPin,
  area: Ruler,
  timeline: Calendar,
  scope: Hammer,
  contact: ContactRound,
  phone: Phone,
  email: Mail,
  fullName: UserRound,
};

export const RESOLVED_FIELD_ACCENT: Record<ResolvedFieldFriendlyKey, string> = {
  propertyType: "bg-emerald-500/15 text-emerald-500",
  city: "bg-emerald-500/15 text-emerald-500",
  area: "bg-amber-500/15 text-amber-500",
  timeline: "bg-violet-500/15 text-violet-500",
  scope: "bg-orange-500/15 text-orange-500",
  contact: "bg-sky-500/15 text-sky-500",
  phone: "bg-sky-500/15 text-sky-500",
  email: "bg-sky-500/15 text-sky-500",
  fullName: "bg-sky-500/15 text-sky-500",
};

export function resolveFieldFriendlyKey(fieldKey: string): ResolvedFieldFriendlyKey {
  return RESOLVED_FIELD_KEY_MAP[fieldKey] ?? "city";
}
