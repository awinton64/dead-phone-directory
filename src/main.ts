import "./styles/base.css";
import "./styles/layout.css";
import "./styles/directory.css";
import "./styles/drill.css";
import "./styles/print.css";

import { loadState, saveState, demoState } from "./lib/storage.ts";
import type { AppState } from "./lib/storage.ts";
import { initTheme } from "./ui/theme.ts";
import { initContacts } from "./ui/contacts.ts";
import { initPlan } from "./ui/plan.ts";

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
}

function initNav(): void {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Main navigation"]');
  if (!nav) return;

  const list = nav.querySelector("ul");
  if (!list) return;

  // Replace the static <a> links produced in index.html with <button> elements
  // so we don't change the URL and can manage aria-current properly.
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
// Demo data button
// ---------------------------------------------------------------------------

function initDemoButton(): void {
  const btn = document.getElementById("btn-load-demo");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Replace all contacts and plan with fictional demo data? Your current data will be lost.",
    );
    if (!confirmed) return;
    state = demoState();
    save(state);
    // Re-initialise contact and plan views with new state
    initContacts(state, save);
    initPlan(state, save);
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function boot(): void {
  initNav();
  showSection("directory");

  // Theme — save callback persists theme choice into state
  initTheme(state, (pref) => {
    state.theme = pref;
    save(state);
  });

  initContacts(state, save);
  initPlan(state, save);
  initDemoButton();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
