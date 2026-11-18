// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { initDrill } from "./drill.ts";
import type { AppState, Contact } from "../lib/storage.ts";

// ---------------------------------------------------------------------------
// Minimal fixture: 3 contacts all due today, each mustMemorize
// ---------------------------------------------------------------------------

function today(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function makeContact(id: string, phone: string): Contact {
  return {
    id,
    name: `Contact ${id}`,
    relation: "Friend",
    phone,
    mustMemorize: true,
    box: 1,
    nextDue: today(),
  };
}

function makeState(): AppState {
  return {
    version: 1,
    contacts: [
      makeContact("c1", "2125550101"),
      makeContact("c2", "2125550102"),
      makeContact("c3", "2125550103"),
    ],
    plan: { meetingPlace: "", fallback: "" },
    drillLog: [],
    theme: "system",
  };
}

// ---------------------------------------------------------------------------
// DOM scaffold matching what main.ts provides
// ---------------------------------------------------------------------------

function buildDom(): void {
  document.body.innerHTML = `
    <div id="streak-display"></div>
    <div id="drill-session"></div>
  `;
}

// ---------------------------------------------------------------------------
// Helpers for interacting with the drill UI
// ---------------------------------------------------------------------------

function getSession(): HTMLElement {
  return document.getElementById("drill-session") as HTMLElement;
}

function clickStart(): void {
  const btn = getSession().querySelector<HTMLButtonElement>("button.btn-primary");
  if (!btn) throw new Error("Start Drill button not found");
  btn.click();
}

function submitAnswer(value: string): void {
  const input = getSession().querySelector<HTMLInputElement>(".drill-input");
  if (!input) throw new Error(".drill-input not found");
  input.value = value;
  const submit = getSession().querySelector<HTMLButtonElement>(".drill-submit");
  if (!submit) throw new Error(".drill-submit not found");
  submit.click();
}

function clickNext(): void {
  // There must be exactly one .drill-next; this asserts that implicitly.
  const btn = document.querySelector<HTMLButtonElement>(".drill-next");
  if (!btn) throw new Error(".drill-next not found");
  btn.click();
}

function countNextButtons(): number {
  return document.querySelectorAll(".drill-next").length;
}

function progressText(): string {
  const p = getSession().querySelector(".drill-progress");
  return p?.textContent ?? "";
}

function summaryText(): string {
  const p = getSession().querySelector(".drill-score");
  return p?.textContent ?? "";
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Dead Phone Drill regression: no skipped cards", () => {
  let state: AppState;

  beforeEach(() => {
    state = makeState();
    buildDom();
    initDrill(state, () => {/* save is a no-op in tests */});
    clickStart();
  });

  it("shows card 1 of 3 on start", () => {
    expect(progressText()).toBe("1 of 3");
  });

  it("has exactly one .drill-next after answering card 1", () => {
    submitAnswer("2125550101"); // correct
    expect(countNextButtons()).toBe(1);
  });

  it("advances to card 2 of 3 after clicking Next on card 1", () => {
    submitAnswer("2125550101"); // correct
    clickNext();
    expect(progressText()).toBe("2 of 3");
  });

  it("has exactly one .drill-next after answering card 2", () => {
    submitAnswer("2125550101"); // correct
    clickNext();
    submitAnswer("0000000000"); // wrong
    expect(countNextButtons()).toBe(1);
  });

  it("advances to card 3 of 3 after clicking Next on card 2", () => {
    submitAnswer("2125550101"); // correct
    clickNext();
    submitAnswer("0000000000"); // wrong
    clickNext();
    expect(progressText()).toBe("3 of 3");
  });

  it("has exactly one .drill-next (Finish) after answering card 3", () => {
    submitAnswer("2125550101"); // correct
    clickNext();
    submitAnswer("0000000000"); // wrong
    clickNext();
    submitAnswer("2125550103"); // correct
    expect(countNextButtons()).toBe(1);
    const btn = document.querySelector<HTMLButtonElement>(".drill-next");
    expect(btn?.textContent).toBe("Finish");
  });

  it("shows summary with 2 correct and 1 missed after completing all cards", () => {
    submitAnswer("2125550101"); // correct
    clickNext();
    submitAnswer("0000000000"); // wrong
    clickNext();
    submitAnswer("2125550103"); // correct
    clickNext(); // Finish
    expect(summaryText()).toBe("2 correct, 1 missed");
  });

  it("does not re-answer a card when Submit is clicked twice", () => {
    // Answer card 1 correctly, then click Submit again (stale click)
    submitAnswer("2125550101");
    // A second submit on the now-disabled input should be ignored
    submitAnswer("0000000000");
    // Still only one Next button, score not doubled
    expect(countNextButtons()).toBe(1);
    // Advance through remaining cards to verify total score is unaffected
    clickNext();
    submitAnswer("0000000000"); // wrong
    clickNext();
    submitAnswer("2125550103"); // correct
    clickNext(); // Finish
    expect(summaryText()).toBe("2 correct, 1 missed");
  });
});
