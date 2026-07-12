import { cn } from "@/lib/utils";

export type LegalTable = {
  headers: string[];
  rows: string[][];
};

type TrustLegalTableProps = {
  table: LegalTable;
  className?: string;
};

export function TrustLegalTable({ table, className }: TrustLegalTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border/35", className)}>
      <table className="w-full min-w-[280px] text-left text-sm">
        <thead>
          <tr className="border-b border-border/35 bg-muted/20">
            {table.headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 font-medium text-foreground first:pl-5 last:pr-5"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr
              key={row.join("-")}
              className={cn(
                "border-b border-border/25 last:border-b-0",
                rowIndex % 2 === 1 && "bg-muted/10",
              )}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className="px-4 py-3 text-muted-foreground first:pl-5 first:font-medium first:text-foreground last:pr-5"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
