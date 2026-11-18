import type { AppState } from "../lib/storage.ts";

type ThemePref = "light" | "dark" | "system";

// Display names map to the product's three named modes.
// "system" follows the OS, "light" is paper-white, "dark" is called "Candlelight".
const BUTTON_LABELS: Record<ThemePref, string> = {
  system: "Theme: System",
  light: "Theme: Light",
  dark: "Theme: Candlelight",
};

const CYCLE: ThemePref[] = ["system", "light", "dark"];

/** Apply data-theme attribute to <html> based on preference + system setting. */
function applyTheme(pref: ThemePref): void {
  const root = document.documentElement;
  if (pref === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", pref);
  }
}

/** Update the toggle button text to name the current mode. */
function updateButton(btn: HTMLButtonElement, pref: ThemePref): void {
  btn.textContent = BUTTON_LABELS[pref];
  // aria-label mirrors the visible text; no aria-live needed since the
  // button text itself changes in place and the user triggered the action.
  btn.removeAttribute("aria-label");
}

/**
 * Initialise theme from saved state, wire the toggle button, and
 * listen for OS-level preference changes (only relevant in "system" mode).
 *
 * Returns a cleanup function (removes the media-query listener).
 */
export function initTheme(
  state: AppState,
  onSave: (pref: ThemePref) => void,
): () => void {
  const btn = document.getElementById("theme-toggle") as HTMLButtonElement | null;

  let current: ThemePref = state.theme ?? "system";

  applyTheme(current);
  if (btn) updateButton(btn, current);

  // OS preference change listener
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onMqChange = (): void => {
    // Only reacts when in system mode: CSS handles the actual colours,
    // but we may want to keep the button icon reflecting reality.
    if (current === "system") {
      if (btn) updateButton(btn, "system");
    }
  };
  mq.addEventListener("change", onMqChange);

  if (btn) {
    btn.addEventListener("click", () => {
      const idx = CYCLE.indexOf(current);
      current = CYCLE[(idx + 1) % CYCLE.length]!;
      applyTheme(current);
      updateButton(btn, current);
      onSave(current);
    });
  }

  return () => {
    mq.removeEventListener("change", onMqChange);
  };
}
