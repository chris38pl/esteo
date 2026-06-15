import type { Issue, IssueAttachment } from "@prisma/client";

import { parseIssueContext } from "@/features/issues/lib/issue-context";

type CursorPromptIssue = Pick<
  Issue,
  | "number"
  | "title"
  | "type"
  | "priority"
  | "status"
  | "environment"
  | "description"
  | "reproductionSteps"
  | "expectedBehavior"
  | "actualBehavior"
  | "pageUrl"
  | "context"
  | "deviceType"
  | "viewportWidth"
  | "viewportHeight"
  | "locale"
> & {
  attachments: Array<Pick<IssueAttachment, "id" | "originalFileName">>;
};

export function buildCursorPrompt(issue: CursorPromptIssue): string {
  const context = parseIssueContext(issue.context);
  const contextJson = context ? JSON.stringify(context) : "—";

  const lines = [
    `Przeanalizuj issue #${issue.number}.`,
    "",
    `Tytuł: ${issue.title}`,
    "",
    `Typ: ${issue.type}`,
    `Priorytet: ${issue.priority}`,
    `Status: ${issue.status}`,
    `Środowisko: ${issue.environment}`,
    "",
    "Opis:",
    issue.description,
  ];

  if (issue.reproductionSteps) {
    lines.push("", "Kroki reprodukcji:", issue.reproductionSteps);
  }

  if (issue.expectedBehavior) {
    lines.push("", "Oczekiwane:", issue.expectedBehavior);
  }

  if (issue.actualBehavior) {
    lines.push("", "Rzeczywiste:", issue.actualBehavior);
  }

  lines.push(
    "",
    "Metadane:",
    `- URL: ${issue.pageUrl}`,
    `- Context: ${contextJson}`,
    `- Device: ${issue.deviceType.toLowerCase()} (${issue.viewportWidth}×${issue.viewportHeight})`,
    `- Locale: ${issue.locale}`,
    "",
    "Screenshoty:",
    issue.attachments.length > 0
      ? `- ${issue.attachments.length} załączone (admin panel / lokalny sync)`
      : "- brak",
  );

  return lines.join("\n");
}
