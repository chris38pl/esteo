import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  ISSUE_COMMENT_DRAFT_HINT,
  buildIssueCommentDraftPath,
} from "../lib/issue-comment-draft-path";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureIssueCommentDraft(issueNumber: number): Promise<void> {
  const draftPath = buildIssueCommentDraftPath(issueNumber);
  const exists = await fileExists(draftPath);

  if (exists) {
    return;
  }

  await mkdir(path.dirname(draftPath), { recursive: true });
  await writeFile(draftPath, ISSUE_COMMENT_DRAFT_HINT, "utf8");
}
