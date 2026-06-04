import type { ReactNode } from "react";

export default function WorkspaceRequestDetailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="mx-auto min-w-0 w-full max-w-full">{children}</div>;
}
