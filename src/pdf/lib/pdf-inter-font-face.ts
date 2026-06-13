import { readPdfAssetBuffer } from "@/pdf/lib/read-pdf-asset";

const PDF_INTER_FONT_FILES = [
  { file: "inter-latin-400-normal.woff2", weight: 400 },
  { file: "inter-latin-600-normal.woff2", weight: 600 },
  { file: "inter-latin-700-normal.woff2", weight: 700 },
] as const;

let cachedFontFaceCss: string | null = null;
let loadPromise: Promise<void> | null = null;

function buildFontFaceRule(weight: number, base64: string): string {
  return `@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
  src: url(data:font/woff2;base64,${base64}) format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}`;
}

async function loadFontFaceCss(): Promise<void> {
  if (cachedFontFaceCss) {
    return;
  }

  const rules = PDF_INTER_FONT_FILES.map(({ file, weight }) => {
    const buffer = readPdfAssetBuffer(`public/fonts/pdf/${file}`);
    return buildFontFaceRule(weight, buffer.toString("base64"));
  });

  cachedFontFaceCss = rules.join("\n");
}

/** Preload bundled Inter subset before synchronous template rendering. */
export async function ensurePdfInterFontFaceReady(): Promise<void> {
  if (cachedFontFaceCss) {
    return;
  }

  if (!loadPromise) {
    loadPromise = loadFontFaceCss();
  }

  await loadPromise;
}

export function getPdfInterFontFaceCss(): string {
  return cachedFontFaceCss ?? "";
}
