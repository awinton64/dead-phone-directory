import "./styles/base.css";
import "./styles/layout.css";
import "./styles/directory.css";
import "./styles/drill.css";
import "./styles/print.css";

import { loadState, saveState } from "./lib/storage.ts";
import type { AppState } from "./lib/storage.ts";
import { initTheme } from "./ui/theme.ts";
import { initContacts } from "./ui/contacts.ts";
import { initPlan } from "./ui/plan.ts";
import { initDrill, renderStreak } from "./ui/drill.ts";
import { initDemo, loadDemo } from "./ui/demo.ts";
import { initPrint } from "./ui/print.ts";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let state: AppState = loadState();

function save(next: AppState): void {
  state = next;
  saveState(state);
}

// ---------------------------------------------------------------------------
// Section navigation
// ---------------------------------------------------------------------------

const SECTIONS = ["directory", "drill", "plan", "print"] as const;
type SectionId = (typeof SECTIONS)[number];

function showSection(id: SectionId): void {
  for (const name of SECTIONS) {
    const sec = document.getElementById(`section-${name}`);
    if (sec) sec.hidden = name !== id;

    const btn = document.querySelector<HTMLButtonElement>(
      `nav button[data-section="${name}"]`,
    );
    if (btn) {
      btn.setAttribute("aria-current", name === id ? "true" : "false");
    }
  }

  // Re-render streak when navigating to drill (picks up any contacts added)
  if (id === "drill") {
    renderStreak(state);
  }
}

function initNav(): void {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Main navigation"]');
  if (!nav) return;

  const list = nav.querySelector("ul");
  if (!list) return;

  list.innerHTML = "";

  const labels: Record<SectionId, string> = {
    directory: "Directory",
    drill: "Drill",
    plan: "Plan",
    print: "Print",
  };

  for (const name of SECTIONS) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset["section"] = name;
    btn.textContent = labels[name];
    btn.setAttribute("aria-current", name === "directory" ? "true" : "false");
    btn.addEventListener("click", () => showSection(name));
    li.appendChild(btn);
    list.appendChild(li);
  }
}

// ---------------------------------------------------------------------------
// Intro panel
// ---------------------------------------------------------------------------

function updateIntroPanel(): void {
  const panel = document.getElementById("intro-panel");
  if (!panel) return;
  // Hide the panel once the directory has at least one contact
  panel.hidden = state.contacts.length > 0;
}

function initIntroPanel(onRerender: (next: AppState) => void): void {
  updateIntroPanel();

  const demoBtn = document.getElementById("btn-intro-demo");
  const drillBtn = document.getElementById("btn-intro-drill");

  demoBtn?.addEventListener("click", () => {
    loadDemo(() => state, onRerender);
  });

  drillBtn?.addEventListener("click", () => {
    // Load demo data first if the directory is empty, then go to drill
    if (state.contacts.length === 0) {
      loadDemo(() => state, onRerender);
    }
    showSection("drill");
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function boot(): void {
  initNav();
  showSection("directory");

  initTheme(state, (pref) => {
    state.theme = pref;
    save(state);
  });

  function rerenderAll(next: AppState): void {
    save(next);
    initContacts(next, save);
    initPlan(next, save);
    initDrill(next, (s) => save(s));
    initPrint();
    updateIntroPanel();
  }

  initContacts(state, (next) => {
    save(next);
    updateIntroPanel();
  });
  initPlan(state, save);

  initDrill(state, (next) => {
    save(next);
  });

  // Export, import, and toolbar demo button
  initDemo(
    () => state,
    rerenderAll,
  );

  initIntroPanel(rerenderAll);

  initPrint();

  // Service worker: production only; skipped during `vite dev`
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err: unknown) => {
        // SW registration failure is non-fatal; app works without it
        console.warn("SW registration failed:", err);
      });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
