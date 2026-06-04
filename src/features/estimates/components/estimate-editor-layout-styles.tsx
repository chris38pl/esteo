"use client";

import { getEstimateEditorResponsiveCss } from "@/features/estimates/lib/estimate-layout-config";

/** Injects responsive layout CSS from `ESTIMATE_LAYOUT_CONFIG`. */
export function EstimateEditorLayoutStyles() {
  return (
    <style
      data-estimate-layout-config
      dangerouslySetInnerHTML={{ __html: getEstimateEditorResponsiveCss() }}
    />
  );
}
