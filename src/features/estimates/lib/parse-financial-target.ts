import type {
  EditIntent,
  FinancialTarget,
} from "@/features/estimates/lib/estimate-agent-types";

function normalizeNumberToken(raw: string): number | null {
  const cleaned = raw
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.k]/g, "");

  if (!cleaned) {
    return null;
  }

  const kMatch = cleaned.match(/^(\d+(?:\.\d+)?)k$/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }

  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) {
    return null;
  }

  return Math.round(num);
}

function parseAbsoluteAmount(message: string): number | null {
  const text = message.toLowerCase();

  const tysMatch = text.match(/(\d+[\s,.]?\d*)\s*(tys\.?|tyś\.?|tysięc|tysiec)/);
  if (tysMatch) {
    const base = normalizeNumberToken(tysMatch[1]);
    return base != null ? base * 1000 : null;
  }

  const kMatch = text.match(/(\d+[\s,.]?\d*)\s*k\b/);
  if (kMatch) {
    const base = normalizeNumberToken(kMatch[1]);
    return base != null ? base * 1000 : null;
  }

  const plnMatch = text.match(/(\d[\d\s,.]*)\s*(pln|zł|zl)\b/);
  if (plnMatch) {
    const digits = plnMatch[1].replace(/\s/g, "").replace(/,/g, "");
    const value = parseInt(digits, 10);
    return Number.isNaN(value) ? null : value;
  }

  const bareMatch = text.match(/\b(\d[\d\s]{2,})\b/);
  if (bareMatch) {
    const digits = bareMatch[1].replace(/\s/g, "").replace(/,/g, "");
    const value = parseInt(digits, 10);
    if (!Number.isNaN(value) && value >= 100) {
      return value;
    }
  }

  return null;
}

function parsePercentAdjustment(message: string): number | null {
  const text = message.toLowerCase();
  const match = text.match(/(\d+[\s,.]?\d*)\s*%/);
  if (!match) {
    return null;
  }
  const pct = parseFloat(match[1].replace(",", "."));
  return Number.isNaN(pct) ? null : pct;
}

function isNetKind(message: string): boolean {
  const text = message.toLowerCase();
  return /\b(netto|net\b|bez\s+vat)\b/.test(text) && !/\bbrutto\b/.test(text);
}

function buildTarget(
  kind: "gross" | "net",
  targetValue: number,
  currentGross: number,
  currentNet: number,
): FinancialTarget {
  const currentValue = kind === "net" ? currentNet : currentGross;
  const difference = targetValue - currentValue;
  const changePercent =
    currentValue !== 0 ? (difference / currentValue) * 100 : targetValue > 0 ? 100 : 0;

  return {
    kind,
    targetValue,
    currentValue,
    difference: Math.round(difference * 100) / 100,
    changePercent: Math.round(changePercent * 10) / 10,
  };
}

export function parseFinancialTarget(
  message: string,
  current: { gross: number; net: number },
  intent: EditIntent,
): FinancialTarget | null {
  if (intent !== "budget_target" && intent !== "budget_adjustment") {
    return null;
  }

  const kind: "gross" | "net" = isNetKind(message) ? "net" : "gross";
  const currentValue = kind === "net" ? current.net : current.gross;

  if (intent === "budget_adjustment") {
    const pct = parsePercentAdjustment(message);
    if (pct == null) {
      return null;
    }

    const text = message.toLowerCase();
    const decrease =
      /\b(zmniejsz|obniż|obniz|redukcja|redukuj|taniej|mniej|lower|reduce|decrease|less)\b/.test(
        text,
      );
    const factor = decrease ? 1 - pct / 100 : 1 + pct / 100;
    const targetValue = Math.round(currentValue * factor * 100) / 100;

    return buildTarget(kind, targetValue, current.gross, current.net);
  }

  const absolute = parseAbsoluteAmount(message);
  if (absolute == null) {
    return null;
  }

  return buildTarget(kind, absolute, current.gross, current.net);
}
