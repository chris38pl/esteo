import path from "node:path";

import {
  ISSUE_COMMENT_DRAFT_HINT,
  buildIssueCommentDraftRelativePath,
} from "../../src/features/issues/lib/issue-implementation-comment";

export { ISSUE_COMMENT_DRAFT_HINT };

export function buildIssueCommentDraftPath(issueNumber: number, cwd = process.cwd()): string {
  return path.join(cwd, buildIssueCommentDraftRelativePath(issueNumber));
}
