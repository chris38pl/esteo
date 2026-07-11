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
    "Wnioskuj typowe prace, które kosztorysant uwzględniłby z doświadczenia - klient nie musi wymieniać każdego zadania.",
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
    "Wnioskuj typowe prace, które kosztorysant uwzględniłby z doświadczenia - klient nie musi wymieniać każdego zadania.",
    "Gdy brief podaje wolumen dokumentów (np. liczba faktur miesięcznie), odzwierciedl to w pozycjach księgowych lub skali usługi.",
    "Gdy brief dotyczy cateringu lub wymagań menu (np. udział menu wegetariańskiego), uwzględnij przygotowanie menu jako wycenioną pozycję lub element zakresu.",
    "Preferuj kilka uzasadnionych pozycji nad jednym ogólnym opisem.",
    "Nie wymyślaj prac spoza branży lub zakresu projektu.",
    "Nie twórz sztucznych pozycji wyłącznie po to, aby zwiększyć liczbę wierszy.",
  ].join("\n");
}

export function formatServiceOutputRulesBlock(
  locale: "pl" | "en",
  options?: { dynamicStructure?: boolean },
): string {
  const dynamic = options?.dynamicStructure ?? false;

  if (locale === "en") {
    return [
      "## Output Rules",
      "- Return only structured JSON (sections with title and items).",
      "- Output is a priced estimate, not a project summary.",
      "- Return only **Commercial Sections** (sections with commercial line items).",
      "- A Commercial Section may include items at 0 or negative unitPrice when commercially meaningful (e.g. included transport, promotional discount).",
      "- Do not use Commercial Sections to store narrative information (scope summaries, terms, exclusions). The Project Brief is outside the estimate.",
      "- Do not create narrative section titles: Scope, Notes, Description.",
      "- Each line item is one commercial service/task with quantity, unit, and unitPrice - not a paragraph restating the brief.",
      ...(dynamic
        ? [
            "- Propose your own Commercial Section titles - there is no fixed section list.",
          ]
        : [
            "- Return all applicable sections from Estimate Structure.",
            "- section.title: use titles from Estimate Structure when possible.",
          ]),
      "- Follow Workspace Rules for item breakdown.",
      "- quantity must be at least 1.",
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
    "- Zwróć wyłącznie **Sekcje handlowe** (Commercial Sections) z pozycjami handlowymi.",
    "- Sekcja handlowa może zawierać pozycje o cenie 0 zł lub ujemnej, jeśli mają znaczenie handlowe (np. transport wliczony, rabat).",
    "- Nie używaj sekcji handlowych do przechowywania informacji opisowych (podsumowanie zakresu, warunki, wyłączenia). Brief klienta jest poza kosztorysem.",
    "- Nie twórz sekcji narracyjnych: Zakres, Uwagi, Opis.",
    "- Każda pozycja to jedna usługa/zadanie handlowe z quantity, unit i unitPrice - nie akapit powtarzający brief.",
    ...(dynamic
      ? [
          "- Zaproponuj własne tytuły sekcji handlowych - brak stałej listy sekcji.",
        ]
      : [
          "- Zwróć wszystkie sekcje z Estimate Structure, które mają zastosowanie.",
          "- section.title: używaj tytułów z Estimate Structure, gdy to możliwe.",
        ]),
    "- Stosuj Workspace Rules przy rozbiciu pozycji.",
    "- quantity ≥ 1.",
    "- Odpowiedź po polsku (nazwy pozycji i sekcji).",
    "- vatRate jako ułamek dziesiętny (np. 0.23 dla 23% VAT).",
    "- unit: null gdy brak jednostki.",
    "- suggestedMarginPercent: null gdy nie sugerujesz marży globalnej.",
    "- sortOrder od 0 w każdej sekcji.",
    "- Bez prozy poza polami schematu.",
  ].join("\n");
}

export function formatDynamicEstimateStructureBlock(locale: "pl" | "en"): string {
  if (locale === "en") {
    return [
      "## Estimate Structure",
      "This industry has no predefined section list. Propose the most natural **Commercial Section** structure for the Business Type and Project Brief.",
      "Create only Commercial Sections with commercial line items.",
      "When the brief naturally splits into phases (e.g. diagnostics → repair → parts), use separate narrow sections.",
      "When the service is uniform (e.g. content preparation for a website), a single Commercial Section is fine.",
      "Do not invent sections only to increase section count.",
      "If a section would have no commercial line items, omit it entirely.",
    ].join("\n");
  }

  return [
    "## Estimate Structure",
    "Ta branża nie ma predefiniowanej listy sekcji. Zaproponuj najbardziej naturalną strukturę **sekcji handlowych** (Commercial Sections) dla Business Type i briefu.",
    "Twórz wyłącznie sekcje handlowe z pozycjami handlowymi.",
    "Gdy brief naturalnie dzieli się na fazy (np. diagnostyka → naprawa → części), użyj osobnych wąskich sekcji.",
    "Gdy usługa jest jednolita (np. przygotowanie treści na stronę WWW), jedna sekcja handlowa jest w porządku.",
    "Nie wymyślaj sekcji wyłącznie po to, aby zwiększyć ich liczbę.",
    "Jeśli sekcja nie miałaby pozycji handlowych, pomiń ją całkowicie.",
  ].join("\n");
}

export function formatDynamicSectionNamingRulesBlock(locale: "pl" | "en"): string {
  if (locale === "en") {
    return [
      "## Commercial Section Naming",
      "Section titles must describe a **group of work or services**, not the document.",
      "Good examples: Diagnostics, Repair, Basic package, Grooming services, Materials, Content preparation, Spare parts.",
      "Avoid: Offer, Estimate, Quote, Realization, Services (too generic), Scope, Notes, Description, Main works.",
    ].join("\n");
  }

  return [
    "## Nazewnictwo sekcji handlowych",
    "Tytuły sekcji opisują **grupę prac lub usług**, nie dokument.",
    "Dobre przykłady: Diagnostyka, Naprawa, Pakiet podstawowy, Usługi pielęgnacyjne, Materiały, Przygotowanie treści, Części zamienne.",
    "Unikaj: Oferta, Kosztorys, Wycena, Realizacja, Usługi (zbyt ogólne), Zakres, Uwagi, Opis, Prace główne.",
  ].join("\n");
}

export function formatOutputRulesBlock(locale: "pl" | "en"): string {
  if (locale === "en") {
    return [
      "## Output Rules",
      "CRITICAL: Every user-visible string in your response MUST be in English (en). Never mix languages.",
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
    "CRITICAL: Każdy tekst widoczny dla użytkownika MUSI być po polsku (pl). Nie mieszaj języków.",
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
