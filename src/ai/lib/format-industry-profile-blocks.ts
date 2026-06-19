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

export function formatComplexityDerivationRulesBlock(rules: string[]): string {
  if (rules.length === 0) {
    return "";
  }

  return `## Project Complexity (internal)\n${bulletList(rules)}`;
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

export function formatServiceEstimateCompletenessBlock(locale: "pl" | "en"): string {
  if (locale === "en") {
    return [
      "## Estimate Completeness",
      "The estimate should be reasonably complete for the described project.",
      "Include all work reasonably required for the project scope and standard practice for this service type.",
      "Infer standard work an experienced estimator would include; the customer does not need to list every task.",
      "When the brief states document volume (e.g. monthly invoice count), reflect it in bookkeeping line items or service scale.",
      "When the brief concerns catering or menu requirements (e.g. vegetarian menu share), include menu preparation as a priced line item or explicit scope element.",
      "Prefer several justified line items over one broad summary row.",
      "Do not invent work outside the industry or project scope.",
      "Do not create artificial line items only to increase row count.",
    ].join("\n");
  }

  return [
    "## Estimate Completeness",
    "Kosztorys powinien być rozsądnie kompletny względem opisanego projektu.",
    "Uwzględnij wszystkie prace uzasadnione zakresem i standardem branżowym dla tego typu usług.",
    "Wnioskuj typowe prace, które kosztorysant uwzględniłby z doświadczenia — klient nie musi wymieniać każdego zadania.",
    "Gdy brief podaje wolumen dokumentów (np. liczba faktur miesięcznie), odzwierciedl to w pozycjach księgowych lub skali usługi.",
    "Gdy brief dotyczy cateringu lub wymagań menu (np. udział menu wegetariańskiego), uwzględnij przygotowanie menu jako wycenioną pozycję lub element zakresu.",
    "Preferuj kilka uzasadnionych pozycji nad jednym ogólnym opisem.",
    "Nie wymyślaj prac spoza branży lub zakresu projektu.",
    "Nie twórz sztucznych pozycji wyłącznie po to, aby zwiększyć liczbę wierszy.",
  ].join("\n");
}

export function formatServiceOutputRulesBlock(locale: "pl" | "en"): string {
  if (locale === "en") {
    return [
      "## Output Rules",
      "- Return only structured JSON (sections with title and items).",
      "- Output is a priced estimate, not a project summary.",
      "- Each line item is one billable service/task with quantity, unit, and unitPrice — not a paragraph restating the brief.",
      "- Return all applicable sections from Estimate Structure; put priced work in Services.",
      "- Follow Workspace Rules for item breakdown (e.g. separate consultation vs day-of coordination).",
      "- quantity must be at least 1; use unitPrice 0 only for explicit scope-summary rows in Scope.",
      "- section.title: use titles from Estimate Structure when possible.",
      "- Respond in English.",
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
    "- Wynik to wyceniony kosztorys, nie streszczenie projektu.",
    "- Każda pozycja to jedna wyceniana usługa/zadanie z quantity, unit i unitPrice — nie akapit powtarzający brief.",
    "- Zwróć wszystkie sekcje z Estimate Structure, które mają zastosowanie; wyceniane usługi umieszczaj w Usługi.",
    "- Stosuj Workspace Rules przy rozbiciu pozycji (np. osobno konsultacja i koordynacja dnia ślubu).",
    "- quantity ≥ 1; unitPrice 0 tylko dla jawnego podsumowania zakresu w Zakres.",
    "- section.title: używaj tytułów z Estimate Structure, gdy to możliwe.",
    "- Odpowiedź po polsku (nazwy pozycji i sekcji).",
    "- vatRate jako ułamek dziesiętny (np. 0.23 dla 23% VAT).",
    "- unit: null gdy brak jednostki.",
    "- suggestedMarginPercent: null gdy nie sugerujesz marży globalnej.",
    "- sortOrder od 0 w każdej sekcji.",
    "- Bez prozy poza polami schematu.",
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
