import {
  downloadEstimatePdfFile,
  fetchEstimatePdfBlobUrl,
  revokeEstimatePdfBlobUrl,
} from "@/features/estimates/lib/fetch-estimate-pdf-blob-url";

export function isEstimatePdfWindowOpen(win: Window | null | undefined): win is Window {
  return win != null && !win.closed;
}

/** Sync — call directly from a click handler before any await (avoids popup blockers). */
export function openEstimatePdfPlaceholder(input: {
  title: string;
  hint: string;
}): Window | null {
  const viewer = window.open("about:blank", "_blank");

  if (!viewer) {
    return null;
  }

  try {
    const doc = viewer.document;
    doc.title = input.title;
    doc.body.style.cssText =
      "margin:0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:#fafafa";

    const container = doc.createElement("div");
    container.style.cssText = "text-align:center;padding:2rem;max-width:24rem";

    const titleEl = doc.createElement("p");
    titleEl.style.cssText = "font-size:1.125rem;font-weight:600;margin:0 0 0.5rem";
    titleEl.textContent = input.title;

    const hintEl = doc.createElement("p");
    hintEl.style.cssText = "font-size:0.875rem;margin:0;color:#a3a3a3";
    hintEl.textContent = input.hint;

    container.appendChild(titleEl);
    container.appendChild(hintEl);
    doc.body.appendChild(container);
  } catch {
    // Ignore if the window is no longer writable.
  }

  return viewer;
}

/** Render a blob PDF in an already-open popup so the tab title stays under our control. */
export function renderEstimatePdfInWindow(
  win: Window | null | undefined,
  input: {
    blobUrl: string;
    viewerTitle: string;
    fileName: string;
    downloadLabel: string;
  },
): boolean {
  if (!isEstimatePdfWindowOpen(win)) {
    return false;
  }

  try {
    const doc = win.document;
    doc.title = input.viewerTitle;
    doc.head.replaceChildren();

    const charsetMeta = doc.createElement("meta");
    charsetMeta.setAttribute("charset", "utf-8");
    doc.head.appendChild(charsetMeta);

    const titleEl = doc.createElement("title");
    titleEl.textContent = input.viewerTitle;
    doc.head.appendChild(titleEl);

    doc.body.replaceChildren();
    doc.body.style.cssText =
      "margin:0;height:100vh;overflow:hidden;background:#0a0a0a;display:flex;flex-direction:column";

    const toolbar = doc.createElement("div");
    toolbar.style.cssText =
      "display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:8px 12px;background:#111827;border-bottom:1px solid #1f2937;flex-shrink:0";

    const downloadButton = doc.createElement("button");
    downloadButton.type = "button";
    downloadButton.textContent = input.downloadLabel;
    downloadButton.style.cssText =
      "font-family:system-ui,sans-serif;font-size:13px;font-weight:500;padding:6px 12px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#f9fafb;cursor:pointer";
    downloadButton.addEventListener("click", () => {
      downloadEstimatePdfFile(input.blobUrl, input.fileName);
    });
    toolbar.appendChild(downloadButton);

    const iframe = doc.createElement("iframe");
    iframe.src = input.blobUrl;
    iframe.title = input.viewerTitle;
    iframe.style.cssText = "border:0;flex:1;width:100%;min-height:0;display:block;background:#fff";

    doc.body.appendChild(toolbar);
    doc.body.appendChild(iframe);

    win.addEventListener(
      "beforeunload",
      () => {
        revokeEstimatePdfBlobUrl(input.blobUrl);
      },
      { once: true },
    );

    return true;
  } catch {
    return false;
  }
}

/** Fetch signed PDF URL into a blob and show it in the placeholder popup. */
export async function showEstimatePdfInWindow(
  win: Window | null | undefined,
  input: {
    url: string;
    viewerTitle: string;
    fileName: string;
    downloadLabel: string;
  },
): Promise<boolean> {
  if (!isEstimatePdfWindowOpen(win)) {
    return false;
  }

  let blobUrl: string | null = null;

  try {
    blobUrl = await fetchEstimatePdfBlobUrl(input.url, input.fileName);
    const rendered = renderEstimatePdfInWindow(win, {
      blobUrl,
      viewerTitle: input.viewerTitle,
      fileName: input.fileName,
      downloadLabel: input.downloadLabel,
    });

    if (!rendered && blobUrl) {
      revokeEstimatePdfBlobUrl(blobUrl);
    }

    return rendered;
  } catch {
    if (blobUrl) {
      revokeEstimatePdfBlobUrl(blobUrl);
    }

    return false;
  }
}

/** @deprecated Prefer showEstimatePdfInWindow to keep tab title control. */
export function navigateEstimatePdfWindow(win: Window | null | undefined, url: string): boolean {
  if (!isEstimatePdfWindowOpen(win)) {
    return false;
  }

  try {
    win.location.href = url;
    return true;
  } catch {
    return false;
  }
}

export function openEstimatePdfFallback(url: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function closeEstimatePdfWindow(win: Window | null | undefined): void {
  if (!isEstimatePdfWindowOpen(win)) {
    return;
  }

  try {
    win.close();
  } catch {
    // Ignore close failures.
  }
}
