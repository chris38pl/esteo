import type { listEstimatePdfsByEstimateId } from "@/features/estimates/server/estimate-pdf-repository";

type RawEstimatePdf = Awaited<ReturnType<typeof listEstimatePdfsByEstimateId>>[number];

export type EstimatePdfClient = {
  id: string;
  estimateId: string;
  versionId: string;
  versionNumber: number;
  generatedAt: string;
};

export function serializeEstimatePdf(row: RawEstimatePdf): EstimatePdfClient {
  return {
    id: row.id,
    estimateId: row.estimateId,
    versionId: row.versionId,
    versionNumber: row.version.versionNumber,
    generatedAt: row.generatedAt.toISOString(),
  };
}

export function serializeEstimatePdfs(rows: RawEstimatePdf[]): EstimatePdfClient[] {
  return rows.map(serializeEstimatePdf);
}
