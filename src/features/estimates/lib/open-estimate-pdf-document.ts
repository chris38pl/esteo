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
