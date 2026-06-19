import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import type { EvalLocale, EvalScenario } from "@evals/engine/schemas/scenario";

const LABELS = {
  pl: {
    projectDescription: "Opis projektu",
    customer: "Klient",
    fullName: "Imię i nazwisko",
    email: "E-mail",
    phone: "Telefon",
    preferredStart: "Preferowany termin startu",
    address: "Lokalizacja usługi",
    city: "Miasto",
    product_categories: "Kategorie zabudowy",
    project_types: "Typ realizacji",
    budget_tier: "Poziom budżetu",
    building_type: "Typ budynku",
  },
  en: {
    projectDescription: "Project description",
    customer: "Customer",
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    preferredStart: "Preferred start date",
    address: "Service location",
    city: "City",
    product_categories: "Product categories",
    project_types: "Project type",
    budget_tier: "Budget tier",
    building_type: "Building type",
  },
} as const;

function formatIndustryFieldValue(
  fieldKey: string,
  value: string | string[],
  locale: EvalLocale,
): string {
  if (Array.isArray(value)) {
    return value
      .map((entry) => getIndustryOptionLabel(fieldKey, entry, locale, "label"))
      .join(", ");
  }
  return getIndustryOptionLabel(fieldKey, value, locale, "label");
}

export function buildEvalProjectBrief(scenario: EvalScenario): string {
  const locale: EvalLocale = scenario.locale;
  const labels = LABELS[locale];
  const lines: string[] = [];

  lines.push(`${labels.projectDescription}: ${scenario.request.project.description.trim()}`);

  const industryFields = scenario.request.industryFields;
  if (industryFields) {
    for (const [key, value] of Object.entries(industryFields)) {
      const fieldLabel = labels[key as keyof typeof labels] ?? key;
      lines.push(`${fieldLabel}: ${formatIndustryFieldValue(key, value, locale)}`);
    }
  }

  const customer = scenario.request.customer;
  if (customer) {
    lines.push(labels.customer);
    lines.push(`- ${labels.fullName}: ${customer.fullName}`);
    lines.push(`- ${labels.email}: ${customer.email}`);
    lines.push(`- ${labels.phone}: ${customer.phone}`);
  }

  if (scenario.request.project.preferredStartDate) {
    lines.push(
      `${labels.preferredStart}: ${scenario.request.project.preferredStartDate}`,
    );
  }

  const location = scenario.request.address?.serviceLocation;
  if (location?.trim()) {
    lines.push(`${labels.address}: ${location.trim()}`);
  }

  const city = scenario.request.address?.city;
  if (city?.trim()) {
    lines.push(`${labels.city}: ${city.trim()}`);
  }

  return lines.join("\n");
}
