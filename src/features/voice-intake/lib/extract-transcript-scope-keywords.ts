import {
  normalizeScopeLabel,
  SCOPE_CANONICAL_GROUPS,
} from "@/ai/lib/voice-intake-scope-terms";

/** Standalone scope nouns often spoken but not always in extraction scope. */
const STANDALONE_TERMS: { term: string; display: string }[] = [
  { term: "gładzie", display: "Gładzie" },
  { term: "gladzie", display: "Gładzie" },
  { term: "tynki", display: "Tynki" },
  { term: "tynk", display: "Tynk" },
  { term: "listwy", display: "Listwy" },
  { term: "listwa", display: "Listwa" },
  { term: "drzwi", display: "Drzwi" },
  { term: "panele", display: "Panele" },
  { term: "panel", display: "Panel" },
  { term: "lustra", display: "Lustra" },
  { term: "lustro", display: "Lustro" },
  { term: "szafy", display: "Szafy" },
  { term: "szafa", display: "Szafa" },
  { term: "zabudowa", display: "Zabudowa" },
  { term: "parapety", display: "Parapety" },
];

function displayLabelForGroupTerm(matchedTerm: string): string {
  const term = matchedTerm.trim();
  if (!term) return "";
  return term.charAt(0).toUpperCase() + term.slice(1);
}

export function extractTranscriptScopeKeywords(cleanedTranscript: string): string[] {
  const normalizedText = normalizeScopeLabel(cleanedTranscript);
  if (!normalizedText) return [];

  const found: string[] = [];
  const seen = new Set<string>();

  function add(label: string) {
    const key = normalizeScopeLabel(label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    found.push(label);
  }

  for (const group of SCOPE_CANONICAL_GROUPS) {
    for (const term of group.terms) {
      const normalizedTerm = normalizeScopeLabel(term);
      if (normalizedTerm.length >= 3 && normalizedText.includes(normalizedTerm)) {
        add(displayLabelForGroupTerm(term));
        break;
      }
    }
  }

  for (const { term, display } of STANDALONE_TERMS) {
    const normalizedTerm = normalizeScopeLabel(term);
    if (normalizedText.includes(normalizedTerm)) {
      add(display);
    }
  }

  return found;
}
