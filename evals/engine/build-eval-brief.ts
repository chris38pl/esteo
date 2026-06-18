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
  },
  en: {
    projectDescription: "Project description",
    customer: "Customer",
    fullName: "Full name",
    email: "Email",
    phone: "Phone",
    preferredStart: "Preferred start date",
    address: "Service location",
  },
} as const;

export function buildEvalProjectBrief(scenario: EvalScenario): string {
  const locale: EvalLocale = scenario.locale;
  const labels = LABELS[locale];
  const lines: string[] = [];

  lines.push(`${labels.projectDescription}: ${scenario.request.project.description.trim()}`);

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

  return lines.join("\n");
}
