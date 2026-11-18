import {
  demoState,
  exportState,
  importState,
  saveState,
  type AppState,
} from "../lib/storage.ts";

type RerenderCallback = (state: AppState) => void;

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function triggerDownload(json: string, filename: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Clean up after the browser has processed the click
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

// ---------------------------------------------------------------------------
// Public: initDemo
// ---------------------------------------------------------------------------

export function initDemo(
  getState: () => AppState,
  onRerender: RerenderCallback,
): void {
  initDemoButton(getState, onRerender);
  initExportButton(getState);
  initImportInput(getState, onRerender);
}

function initDemoButton(
  getState: () => AppState,
  onRerender: RerenderCallback,
): void {
  const btn = document.getElementById("btn-load-demo");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Replace all contacts and plan with fictional demo data? Your current data will be lost.",
    );
    if (!confirmed) return;

    const next = demoState();
    saveState(next);
    onRerender(next);

    showNoticeBanner(
      "Demo data loaded. These are fictional contacts using 555-01xx numbers.",
    );
  });
}

function initExportButton(getState: () => AppState): void {
  const btn = document.getElementById("btn-export");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const json = exportState(getState());
    triggerDownload(json, "dead-phone-directory.json");
  });
}

function initImportInput(
  getState: () => AppState,
  onRerender: RerenderCallback,
): void {
  const input = document.getElementById(
    "import-file",
  ) as HTMLInputElement | null;
  const errorEl = document.getElementById("import-error");
  if (!input) return;

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!errorEl) return;
    errorEl.textContent = "";

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") {
        errorEl.textContent = "Could not read the file.";
        input.value = "";
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        errorEl.textContent = "File is not valid JSON.";
        input.value = "";
        return;
      }

      let next: AppState;
      try {
        next = importState(parsed);
      } catch (err) {
        errorEl.textContent =
          err instanceof Error ? err.message : "Import failed.";
        input.value = "";
        return;
      }

      const confirmed = window.confirm(
        `Replace your current data with the imported data? (${next.contacts.length} contacts) This cannot be undone.`,
      );
      if (!confirmed) {
        input.value = "";
        return;
      }

      saveState(next);
      onRerender(next);
      input.value = "";
      showNoticeBanner("Data imported successfully.");
    };

    reader.onerror = () => {
      if (errorEl) errorEl.textContent = "Failed to read the file.";
      input.value = "";
    };

    reader.readAsText(file);
  });
}

// ---------------------------------------------------------------------------
// Notice banner
// ---------------------------------------------------------------------------

function showNoticeBanner(message: string): void {
  // Remove any existing banner
  const existing = document.getElementById("demo-notice-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "demo-notice-banner";
  banner.className = "notice";
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  banner.textContent = message;

  // Insert at top of main content area
  const main = document.querySelector("main");
  if (main) {
    main.insertBefore(banner, main.firstChild);
  }

  // Auto-dismiss after 6 seconds
  setTimeout(() => banner.remove(), 6000);
}
