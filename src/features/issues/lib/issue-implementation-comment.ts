export const ISSUE_IMPLEMENTATION_COMMENT_MIN_LENGTH = 80;

export const ISSUE_COMMENT_DRAFT_DIR = ".cursor/issue-comments";

export type ImplementationCommentValidationError = "too_short" | "stub";

export function buildIssueCommentDraftRelativePath(issueNumber: number): string {
  return `${ISSUE_COMMENT_DRAFT_DIR}/${issueNumber}.md`;
}

export const ISSUE_COMMENT_DRAFT_HINT = [
  "<Pełne podsumowanie implementacji - to samo co w odpowiedzi Cursora.>",
  "",
  "Usuń tę linię i zapisz diagnozę, zmiany w plikach oraz kroki weryfikacji.",
  "",
].join("\n");

export function isUneditedDraftHint(body: string): boolean {
  return body.trim() === ISSUE_COMMENT_DRAFT_HINT.trim();
}

export function isStubImplementationComment(body: string): boolean {
  const trimmed = body.trim();
  if (!trimmed) {
    return true;
  }

  const normalized = trimmed.toLowerCase().replace(/\s+/g, " ");

  const exactStubs = new Set([
    "zaimplementowano:",
    "zaimplementowano: ...",
    "zaimplementowano: ... testy: ...",
    "zaimplementowano: testy: ...",
    "testy: ...",
    "...",
    "implemented:",
    "implemented: ...",
    "implemented: ... tests: ...",
    "tests: ...",
  ]);

  if (exactStubs.has(normalized)) {
    return true;
  }

  if (/^zaimplementowano:\s*(\.{3})?\s*(testy:\s*(\.{3})?)?$/i.test(trimmed)) {
    return true;
  }

  if (/^implemented:\s*(\.{3})?\s*(tests:\s*(\.{3})?)?$/i.test(trimmed)) {
    return true;
  }

  if (/^(testy|tests):\s*\.{3}\s*$/i.test(trimmed)) {
    return true;
  }

  return false;
}

export function validateImplementationComment(
  body: string,
): { ok: true } | { ok: false; errors: ImplementationCommentValidationError[] } {
  const trimmed = body.trim();
  const errors: ImplementationCommentValidationError[] = [];

  if (trimmed.length < ISSUE_IMPLEMENTATION_COMMENT_MIN_LENGTH) {
    errors.push("too_short");
  }

  if (isStubImplementationComment(trimmed)) {
    errors.push("stub");
  }

  if (isUneditedDraftHint(trimmed)) {
    errors.push("stub");
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function formatImplementationCommentValidationErrors(
  errors: ImplementationCommentValidationError[],
): string {
  const messages: string[] = [];

  if (errors.includes("too_short")) {
    messages.push(
      `Implementation comment is too short (minimum ${ISSUE_IMPLEMENTATION_COMMENT_MIN_LENGTH} characters).`,
    );
  }

  if (errors.includes("stub")) {
    messages.push(
      "Implementation comment looks like a placeholder stub. Write a full summary of what changed.",
    );
  }

  return messages.join(" ");
}
