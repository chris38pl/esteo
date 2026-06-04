export type SearchHighlightPart = { text: string; match: boolean };

/** Splits text into segments for case-insensitive substring highlighting (all matches). */
export function splitSearchHighlight(
  text: string,
  query: string,
): SearchHighlightPart[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [{ text, match: false }];
  }

  const lower = text.toLowerCase();
  const needle = trimmed.toLowerCase();
  const parts: SearchHighlightPart[] = [];
  let index = 0;

  while (index < text.length) {
    const found = lower.indexOf(needle, index);
    if (found === -1) {
      parts.push({ text: text.slice(index), match: false });
      break;
    }
    if (found > index) {
      parts.push({ text: text.slice(index, found), match: false });
    }
    parts.push({
      text: text.slice(found, found + needle.length),
      match: true,
    });
    index = found + needle.length;
  }

  return parts.length > 0 ? parts : [{ text, match: false }];
}
