export const ESTIMATE_SYSTEM_RULE_IDS = ["rounding", "units", "assumptions"] as const;

export type EstimateSystemRuleId = (typeof ESTIMATE_SYSTEM_RULE_IDS)[number];

export type EstimateSystemRuleDefinition = {
  id: EstimateSystemRuleId;
  contentKey: string;
};

export const ESTIMATE_SYSTEM_RULES: EstimateSystemRuleDefinition[] = [
  { id: "rounding", contentKey: "systemRules.rounding" },
  { id: "units", contentKey: "systemRules.units" },
  { id: "assumptions", contentKey: "systemRules.assumptions" },
];

/** English prompt bodies for active system rules (UI copy is translated separately). */
export const ESTIMATE_SYSTEM_RULE_PROMPT: Record<
  EstimateSystemRuleId,
  { title: string; content: string }
> = {
  rounding: {
    title: "Price rounding",
    content:
      "Round unit prices to whole currency amounts unless the line item explicitly requires decimals.",
  },
  units: {
    title: "Measurement units",
    content:
      "Always include measurement units (m², m, pcs, h) next to quantities in estimate line items.",
  },
  assumptions: {
    title: "Net, VAT and gross",
    content:
      "Net, VAT, and gross amounts must be consistent and correctly calculated for every line item.",
  },
};

/** Polish prompt bodies for active system rules. */
export const ESTIMATE_SYSTEM_RULE_PROMPT_PL: Record<
  EstimateSystemRuleId,
  { title: string; content: string }
> = {
  rounding: {
    title: "Zaokrąglanie cen",
    content:
      "Zaokrąglaj ceny jednostkowe do pełnych kwot, chyba że pozycja wymaga groszy.",
  },
  units: {
    title: "Jednostki miary",
    content:
      "Zawsze podawaj jednostki miary (m², m, szt., kpl., h) przy ilościach w pozycjach kosztorysu.",
  },
  assumptions: {
    title: "Netto, VAT i brutto",
    content:
      "Kwoty netto, VAT i brutto muszą być spójne i poprawnie policzone dla każdej pozycji.",
  },
};

export function defaultEstimateSystemRuleState(): Record<EstimateSystemRuleId, boolean> {
  return {
    rounding: true,
    units: true,
    assumptions: true,
  };
}
