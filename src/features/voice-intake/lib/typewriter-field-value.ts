import type { FormFieldPath } from "@/features/voice-intake/lib/apply-field-sequence";

const BASE_CHAR_MS = 32;
const SPACE_CHAR_MS = 14;
const PUNCTUATION_CHAR_MS = 48;
const BETWEEN_FIELDS_MS = 180;
const INSTANT_FIELD_MS = 420;

const DESCRIPTION_MAX_MS = 3_500;
const DESCRIPTION_CHUNK_STEP_MS = 42;
const DESCRIPTION_LONG_TEXT_THRESHOLD = 50;

const MAX_FIELD_MS: Partial<Record<FormFieldPath, number>> = {
  "customer.email": 2_200,
};

function charDelayMs(char: string, path: FormFieldPath, adaptiveMs: number): number {
  if (char === " ") return Math.max(10, adaptiveMs * 0.45);
  if (/[.,!?;:]/.test(char)) return Math.max(16, adaptiveMs * 1.35);
  if (path === "customer.email" && char === "@") return Math.max(20, adaptiveMs * 1.1);
  return adaptiveMs + (Math.random() * 10 - 5);
}

function resolveAdaptiveCharMs(target: string, path: FormFieldPath): number {
  const maxMs = MAX_FIELD_MS[path] ?? 2_800;
  const ideal = target.length * BASE_CHAR_MS;
  if (ideal <= maxMs) return BASE_CHAR_MS;
  return Math.max(12, maxMs / target.length);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typewriterByCharacter(
  path: FormFieldPath,
  text: string,
  onPartial: (partial: string) => void,
  onCharTyped?: () => void,
): Promise<void> {
  onPartial("");
  const adaptiveMs = resolveAdaptiveCharMs(text, path);

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    const partial = text.slice(0, index + 1);
    onPartial(partial);
    onCharTyped?.();

    const base =
      char === " " ? SPACE_CHAR_MS : /[.,!?;:]/.test(char) ? PUNCTUATION_CHAR_MS : adaptiveMs;
    await delay(charDelayMs(char, path, base));
  }
}

/** Fast stepped reveal for long description - same typing feel, capped at ~3.5s. */
async function typewriterByChunks(
  text: string,
  onPartial: (partial: string) => void,
  onCharTyped?: () => void,
): Promise<void> {
  onPartial("");

  const maxSteps = Math.max(1, Math.floor(DESCRIPTION_MAX_MS / DESCRIPTION_CHUNK_STEP_MS));
  const charsPerStep = Math.max(1, Math.ceil(text.length / maxSteps));

  for (let end = charsPerStep; end <= text.length + charsPerStep; end += charsPerStep) {
    const partial = text.slice(0, Math.min(end, text.length));
    onPartial(partial);
    onCharTyped?.();

    if (partial.length >= text.length) {
      break;
    }

    await delay(DESCRIPTION_CHUNK_STEP_MS);
  }

  onPartial(text);
}

export async function typewriterReveal(
  path: FormFieldPath,
  target: string,
  onPartial: (partial: string) => void,
  onCharTyped?: () => void,
): Promise<void> {
  const text = target.trim().length > 0 ? target : "";
  if (!text) {
    onPartial("");
    return;
  }

  if (path === "project.description" && text.length > DESCRIPTION_LONG_TEXT_THRESHOLD) {
    await typewriterByChunks(text, onPartial, onCharTyped);
    return;
  }

  await typewriterByCharacter(path, text, onPartial, onCharTyped);
}

export function getInstantFieldPauseMs(): number {
  return INSTANT_FIELD_MS;
}

export function getBetweenFieldsPauseMs(): number {
  return BETWEEN_FIELDS_MS;
}
