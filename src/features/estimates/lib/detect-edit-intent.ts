import type { EditIntent } from "@/features/estimates/lib/estimate-agent-types";
import type { Locale } from "@/lib/locale";

function normalizeMessage(message: string): string {
  return message.toLowerCase().trim();
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

const PATTERNS: Record<Exclude<EditIntent, "general">, { pl: RegExp[]; en: RegExp[] }> = {
  budget_target: {
    pl: [
      /\b\d+[\s,.]?\d*\s*(tys\.?|tyś\.?|tysięc|tysiec)\b/,
      /\b\d+[\s,.]?\d*\s*k\b/,
      /\b\d+[\s,.]?\d*\s*pln\b/,
      /\b(brutto|kwota|suma|wartość|wartosc|razem|łącznie|lacznie)\b.*\d/,
      /\b\d+[\s,.]?\d*\s*(zł|zl)\b/,
      /\bna\s+\d+[\s,.]?\d*/,
    ],
    en: [
      /\b\d+[\s,.]?\d*\s*k\b/,
      /\b\d+[\s,.]?\d*\s*(pln|usd|eur)\b/,
      /\b(gross|total|amount)\b.*\d/,
      /\bto\s+\d+[\s,.]?\d*/,
    ],
  },
  budget_adjustment: {
    pl: [
      /\b(o| o)\s*\d+[\s,.]?\d*\s*%/,
      /\b\d+[\s,.]?\d*\s*%\s*(taniej|drożej|drozej|więcej|wiecej|mniej)/,
      /\b(zmniejsz|obniż|obniz|podnieś|podnies|zwiększ|redukcja|redukuj)\b.*\d/,
      /\b(o\s+)?\d+[\s,.]?\d*\s*%\b/,
    ],
    en: [
      /\b(by|reduce|increase|decrease|lower|raise)\s+\d+[\s,.]?\d*\s*%/,
      /\b\d+[\s,.]?\d*\s*%\s*(more|less|higher|lower)/,
      /\b\d+[\s,.]?\d*\s*%\s*(increase|reduction|decrease)/,
    ],
  },
  profitability: {
    pl: [
      /\brentowno/,
      /\bmarż/,
      /\bmarza\b/,
      /\bzyskown/,
      /\bprofitabil/,
      /\bwiększ[aą]?\s+zysk/,
    ],
    en: [
      /\bprofitab/,
      /\bprofit\s*margin/,
      /\bmarkup\b/,
      /\bmargin\b/,
      /\bmore\s+profitable/,
    ],
  },
  scope: {
    pl: [
      /\bpod\s+klucz/,
      /\bbrakuj/,
      /\bdodaj\b.*\b(prac|zakres|pozyc)/,
      /\buzupełnij/,
      /\buzupelnij/,
      /\bkomplet/,
      /\błazienk/,
      /\blazienk/,
      /\bkuchni/,
      /\bwykończ/,
      /\bwykoncz/,
    ],
    en: [
      /\bturnkey/,
      /\bmissing\s+work/,
      /\badd\b.*\b(work|scope|items)/,
      /\bcomplete\b.*\b(bathroom|kitchen|room)/,
      /\bfull\s+scope/,
    ],
  },
  realism: {
    pl: [
      /\brealistyczn/,
      /\brynkow/,
      /\bdopasuj\b.*\bcen/,
      /\baktualn[eą]?\s+cen/,
    ],
    en: [
      /\brealistic/,
      /\bmarket\s+(rate|price)/,
      /\badjust\b.*\bprices/,
    ],
  },
};

const INTENT_ORDER: Exclude<EditIntent, "general">[] = [
  "budget_adjustment",
  "budget_target",
  "profitability",
  "scope",
  "realism",
];

export function detectEditIntent(message: string, locale: Locale): EditIntent {
  const text = normalizeMessage(message);
  const lang = locale === "en" ? "en" : "pl";

  for (const intent of INTENT_ORDER) {
    const patterns = PATTERNS[intent][lang];
    if (matchesAny(text, patterns)) {
      return intent;
    }
  }

  if (/\d/.test(text) && matchesAny(text, [/\b(brutto|netto|pln|kwota|suma|total|gross|net)\b/])) {
    return "budget_target";
  }

  return "general";
}
