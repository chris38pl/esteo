import {
  createEstimatePdfPreviewFixture,
  type EstimatePdfPreviewFixtureOptions,
} from "@/pdf/fixtures/estimate-pdf-preview.fixture";
import { ensurePdfTemplateAssetsReady } from "@/pdf/lib/ensure-pdf-template-assets";
import { buildEstimatePdfHtml } from "@/pdf/templates/estimate-pdf-template";

export async function buildEstimatePdfPreviewHtml(
  options: EstimatePdfPreviewFixtureOptions = {},
): Promise<string> {
  await ensurePdfTemplateAssetsReady();
  const model = createEstimatePdfPreviewFixture(options);
  return buildEstimatePdfHtml(model, { screenPagination: true });
}
