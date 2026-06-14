import { Badge } from "@/components/ui/badge";

export function IssueTypeBadge({ label }: { label: string }) {
  return <Badge variant="secondary">{label}</Badge>;
}
