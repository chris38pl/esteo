export const ISSUE_ACTIVITY_ACTIONS = {
  title_changed: "title_changed",
  description_changed: "description_changed",
  status_changed: "status_changed",
  comment_added: "comment_added",
  comment_edited: "comment_edited",
  comment_deleted: "comment_deleted",
} as const;

export type IssueActivityAction =
  (typeof ISSUE_ACTIVITY_ACTIONS)[keyof typeof ISSUE_ACTIVITY_ACTIONS];

export type IssueActivityActorType = "USER" | "CURSOR_AI" | "SYSTEM";

export type IssueActivityMetadata = {
  oldTitle?: string;
  newTitle?: string;
  oldDescription?: string;
  newDescription?: string;
  oldStatus?: string;
  newStatus?: string;
  oldBody?: string;
  newBody?: string;
  commentBody?: string;
  commentId?: string;
  replyCount?: number;
  fixedIn?: string;
};
