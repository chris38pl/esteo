import { buildEstimatePdfHtml } from "@/pdf/templates/estimate-pdf-template";
import {
  createEstimatePdfPreviewFixture,
  type EstimatePdfPreviewFixtureOptions,
} from "@/pdf/fixtures/estimate-pdf-preview.fixture";

export function buildEstimatePdfPreviewHtml(options: EstimatePdfPreviewFixtureOptions = {}): string {
  const model = createEstimatePdfPreviewFixture(options);
  return buildEstimatePdfHtml(model, { screenPagination: true });
}
