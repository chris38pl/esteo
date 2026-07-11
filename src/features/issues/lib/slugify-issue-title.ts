/** Immutable folder slug - set once at issue creation from title. */
export function slugifyIssueTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

  return slug.length > 0 ? slug : "issue";
}

export function buildIssueFolderName(number: number, folderSlug: string): string {
  return `${number}-${folderSlug}`;
}
