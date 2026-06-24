import type { Issue, IssueAttachment } from "@prisma/client";

import { parseIssueContext } from "@/features/issues/lib/issue-context";
import { buildIssueCommentDraftRelativePath } from "@/features/issues/lib/issue-implementation-comment";
import type { IssueCommentClient } from "@/features/issues/lib/serialize-issue-comments";

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
  comments?: IssueCommentClient[];
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

  if (issue.comments && issue.comments.length > 0) {
    lines.push("", "Komentarze:");
    for (const comment of issue.comments) {
      const author =
        comment.actorType === "CURSOR_AI"
          ? "Cursor AI"
          : comment.author?.name?.trim() || comment.author?.email || "System";
      lines.push(`- ${author}: ${comment.body}`);
      for (const reply of comment.replies) {
        const replyAuthor =
          reply.actorType === "CURSOR_AI"
            ? "Cursor AI"
            : reply.author?.name?.trim() || reply.author?.email || "System";
        lines.push(`  - ${replyAuthor}: ${reply.body}`);
      }
    }
  }

  lines.push(
    "",
    "Obowiązkowy workflow dla Cursora:",
    "1. Najpierw uruchom `npm run sync:issues` (lub sync konkretnego issue, jeśli to celowe).",
    "2. Przygotuj plan i wprowadź poprawki.",
    "3. Zapisz pełne podsumowanie implementacji do pliku:",
    `   ${buildIssueCommentDraftRelativePath(issue.number)}`,
    "   Treść pliku = to samo podsumowanie co w odpowiedzi (nie skrót, nie placeholder).",
    "4. Wyślij komentarz implementacyjny:",
    `   npm run issue:comment -- --issue=${issue.number} --resolve --draft`,
    "5. W planie (Create Plan) i po Built: obowiązkowe todo closeout per issue + tabela „Issue closeout” w odpowiedzi (reguła issue-plan-closeout).",
    "6. Nie kończ pracy bez komentarza per issue albo jawnie zgłoś, dlaczego komentarz nie mógł zostać dodany.",
  );

  return lines.join("\n");
}
