/**
 * Deterministic transcript cleaning - 100% information preservation.
 * No LLM, no shortening, no paraphrase.
 */

function normalizeWhitespace(text: string): string {
  const unified = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = unified.split("\n").map((line) => line.replace(/[ \t]+/g, " ").trim());
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizePunctuation(text: string): string {
  return text
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])([^\s\n])/g, "$1 $2")
    .replace(/\.{4,}/g, "...");
}

function capitalizeSentences(text: string): string {
  const lines = text.split("\n");
  return lines
    .map((line) => {
      if (!line.trim()) return line;
      return line.replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
    })
    .join("\n");
}

export function cleanVoiceTranscript(rawTranscript: string): string {
  if (!rawTranscript.trim()) return "";

  let result = normalizeWhitespace(rawTranscript);
  result = normalizePunctuation(result);
  result = capitalizeSentences(result);

  return result;
}
