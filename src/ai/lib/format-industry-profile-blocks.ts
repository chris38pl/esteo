import type { ResolvedIndustryAiProfile } from "@/ai/config/industry-ai-profiles";

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export function formatIndustryRoleBlock(role: string): string {
  return `## Role\n${role.trim()}`;
}

export function formatEstimationPrinciplesBlock(principles: string[]): string {
  if (principles.length === 0) {
    return "";
  }
  return `## Estimation Principles\n${bulletList(principles)}`;
}

export function formatScopeChecklistBlock(items: string[]): string {
  if (items.length === 0) {
    return "";
  }
  return `## Scope Checklist\n${bulletList(items)}`;
}

export function formatScopeExpansionRulesBlock(rules: string[]): string {
  if (rules.length === 0) {
    return "";
  }
  return `## Scope Expansion Rules\n${bulletList(rules)}`;
}

export function formatQuantityDerivationRulesBlock(
  rules: string[],
): string {
  if (rules.length === 0) {
    return "";
  }

  return `## Quantity Derivation Rules\n${bulletList(rules)}`;
}

export function formatIndustryProfileBlocks(profile: ResolvedIndustryAiProfile): string {
  return [
    formatIndustryRoleBlock(profile.role),
    formatEstimationPrinciplesBlock(profile.estimationPrinciples),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function formatEstimateCompletenessBlock(locale: "pl" | "en"): string {
  if (locale === "en") {
    return [
      "## Estimate Completeness",
      "The estimate should be reasonably complete for the described project.",
      "Include all work that is reasonably required for the project scope and standard practice for this industry.",
      "Infer standard work that an experienced estimator would include; do not require the customer to list every task.",
      "Apply the Scope Expansion Rules when interpreting brief phrases.",
      "Do not create artificial line items to satisfy quantity targets.",
      "Do not invent work unrelated to the project scope.",
      "This applies especially to turnkey renovations, developer-standard apartments, bathrooms, kitchens, electrical work, and plumbing work.",
    ].join("\n");
  }

  return [
    "## Estimate Completeness",
    "Kosztorys powinien być rozsądnie kompletny względem opisanego projektu.",
    "Uwzględnij wszystkie prace uzasadnione zakresem i standardem branżowym.",
    "Wnioskuj typowe prace, które kosztorysant uwzględniłby z doświadczenia — klient nie musi wymieniać każdego zadania.",
    "Stosuj Scope Expansion Rules przy interpretacji briefu.",
    "Nie twórz sztucznych pozycji, aby zwiększyć liczbę wierszy.",
    "Nie wymyślaj prac niezwiązanych z zakresem projektu.",
    "Dotyczy to zwłaszcza remontów pod klucz, mieszkań od dewelopera, łazienek, kuchni, instalacji elektrycznych i hydraulicznych.",
  ].join("\n");
}

export function formatOutputRulesBlock(locale: "pl" | "en"): string {
  if (locale === "en") {
    return [
      "## Output Rules",
      "- Return only structured JSON (sections with title and items).",
      "- Every line item must be justified by scope or standard industry practice.",
      "- section.title: use titles from Estimate Structure when possible.",
      `- Respond in English.`,
      "- Set vatRate as a decimal fraction (e.g. 0.23 for 23% VAT).",
      "- Set unit to null when the line item has no unit of measure.",
      "- Set suggestedMarginPercent to null when not suggesting a global margin.",
      "- Use sequential sortOrder values starting at 0 within each section.",
      "- Do not include explanatory prose outside the schema.",
    ].join("\n");
  }

  return [
    "## Output Rules",
    "- Zwróć wyłącznie structured JSON (sekcje z title i items).",
    "- Każda pozycja musi być uzasadniona zakresem lub standardem branżowym.",
    "- section.title: używaj tytułów z Estimate Structure, gdy to możliwe.",
    "- Odpowiedź po polsku (nazwy pozycji i sekcji).",
    "- vatRate jako ułamek dziesiętny (np. 0.23 dla 23% VAT).",
    "- unit: null gdy brak jednostki.",
    "- suggestedMarginPercent: null gdy nie sugerujesz marży globalnej.",
    "- sortOrder od 0 w każdej sekcji.",
    "- Bez prozy poza polami schematu.",
  ].join("\n");
}
