import { loadState, EMERGENCY_CONTACTS } from "../lib/storage.ts";
import { format } from "../lib/phone.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function el<T extends HTMLElement>(
  tag: string,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): T {
  const e = document.createElement(tag) as T;
  for (const [k, v] of Object.entries(attrs)) {
    e.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === "string") {
      e.appendChild(document.createTextNode(child));
    } else {
      e.appendChild(child);
    }
  }
  return e;
}

function localIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// Wallet card DOM (front + back)
// Both faces are placed in .wallet-faces-row so they sit side-by-side on a
// Letter page. The card dimensions (3.375 × 2.125 in) are set in print.css;
// cut-lines (dashed outline) let the user trim the card after printing.
// Text is clamped with ellipsis so nothing overflows the fixed card height.
// ---------------------------------------------------------------------------

function buildWallet(): void {
  const state = loadState();
  const container = document.querySelector<HTMLElement>(".print-wallet");
  if (!container) return;
  container.innerHTML = "";

  const facesRow = el("div", { class: "wallet-faces-row" });

  // ---- Front: 911 + up to 5 must-memorize contacts ----
  const front = el("div", { class: "wallet-face wallet-face-front" });

  const frontTitle = el("h2");
  frontTitle.textContent = "If my phone is dead, call";
  front.appendChild(frontTitle);

  // 911 always first
  const row911 = el("div", { class: "wallet-contact-row" });
  const name911 = el("span", { class: "wallet-contact-name" });
  name911.textContent = "Emergency";
  const phone911 = el("span", { class: "wallet-contact-phone" });
  phone911.textContent = "911";
  row911.appendChild(name911);
  row911.appendChild(phone911);
  front.appendChild(row911);

  const mustMemorize = state.contacts.filter((c) => c.mustMemorize).slice(0, 5);
  for (const contact of mustMemorize) {
    const row = el("div", { class: "wallet-contact-row" });
    const name = el("span", { class: "wallet-contact-name" });
    name.textContent = contact.name;
    const phone = el("span", { class: "wallet-contact-phone" });
    phone.textContent = format(contact.phone);
    row.appendChild(name);
    row.appendChild(phone);
    front.appendChild(row);
  }

  facesRow.appendChild(front);

  // ---- Back: meeting place, fallback, 988, Poison Control ----
  const back = el("div", { class: "wallet-face wallet-face-back" });

  const backTitle = el("h2");
  backTitle.textContent = "Household Plan";
  back.appendChild(backTitle);

  const planDl = el("dl", { class: "wallet-plan" });

  if (state.plan.meetingPlace) {
    const dtMeet = el("dt");
    dtMeet.textContent = "Meet at:";
    const ddMeet = el("dd");
    ddMeet.textContent = state.plan.meetingPlace;
    planDl.appendChild(dtMeet);
    planDl.appendChild(ddMeet);
  }

  if (state.plan.fallback) {
    const dtFall = el("dt");
    dtFall.textContent = "Fallback:";
    const ddFall = el("dd");
    ddFall.textContent = state.plan.fallback;
    planDl.appendChild(dtFall);
    planDl.appendChild(ddFall);
  }

  back.appendChild(planDl);

  const crisisTitle = el("h2");
  crisisTitle.textContent = "Crisis Lines";
  back.appendChild(crisisTitle);

  for (const ec of EMERGENCY_CONTACTS) {
    if (ec.phone === "911") continue;
    const row = el("div", { class: "wallet-contact-row" });
    const name = el("span", { class: "wallet-contact-name" });
    name.textContent = ec.name;
    const phone = el("span", { class: "wallet-contact-phone" });
    phone.textContent = format(ec.phone);
    row.appendChild(name);
    row.appendChild(phone);
    back.appendChild(row);
  }

  facesRow.appendChild(back);
  container.appendChild(facesRow);
}

// ---------------------------------------------------------------------------
// Fridge sheet DOM
// ---------------------------------------------------------------------------

function buildFridge(): void {
  const state = loadState();
  const container = document.querySelector<HTMLElement>(".print-fridge");
  if (!container) return;
  container.innerHTML = "";

  const title = el("h2", { class: "fridge-title" });
  title.textContent = "Our Dead Phone Directory";
  container.appendChild(title);

  // All contacts sorted A–Z
  const sortedContacts = [...state.contacts].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  if (sortedContacts.length > 0) {
    const heading = el("h3", { class: "fridge-section-heading" });
    heading.textContent = "Contacts";
    container.appendChild(heading);

    for (const contact of sortedContacts) {
      const row = el("div", { class: "fridge-contact-row" });
      const mark = el("span", { class: "fridge-memorize-mark" });
      mark.textContent = contact.mustMemorize ? "★" : "";
      if (contact.mustMemorize) mark.setAttribute("aria-label", "must memorize");
      const name = el("span", { class: "fridge-contact-name" });
      name.textContent = contact.name;
      const relation = el("span", { class: "fridge-contact-relation" });
      relation.textContent = contact.relation;
      const phone = el("span", { class: "fridge-contact-phone" });
      phone.textContent = format(contact.phone);
      row.appendChild(mark);
      row.appendChild(name);
      row.appendChild(relation);
      row.appendChild(phone);
      container.appendChild(row);
    }
  }

  // Emergency numbers
  const emergencyHeading = el("h3", { class: "fridge-section-heading" });
  emergencyHeading.textContent = "Emergency Numbers";
  container.appendChild(emergencyHeading);

  for (const ec of EMERGENCY_CONTACTS) {
    const row = el("div", { class: "fridge-contact-row" });
    const name = el("span", { class: "fridge-contact-name" });
    name.textContent = ec.name;
    const phone = el("span", { class: "fridge-contact-phone" });
    phone.textContent = format(ec.phone);
    row.appendChild(name);
    row.appendChild(phone);
    container.appendChild(row);
  }

  // Household plan
  const planHeading = el("h3", { class: "fridge-section-heading" });
  planHeading.textContent = "Household Plan";
  container.appendChild(planHeading);

  const planDl = el("dl", { class: "fridge-plan" });
  const dtMeet = el("dt");
  dtMeet.textContent = "Meeting place:";
  const ddMeet = el("dd");
  ddMeet.textContent = state.plan.meetingPlace || "(not set)";
  const dtFall = el("dt");
  dtFall.textContent = "Fallback contact:";
  const ddFall = el("dd");
  ddFall.textContent = state.plan.fallback || "(not set)";
  planDl.appendChild(dtMeet);
  planDl.appendChild(ddMeet);
  planDl.appendChild(dtFall);
  planDl.appendChild(ddFall);
  container.appendChild(planDl);

  // Practice these by heart
  const memorizeList = state.contacts.filter((c) => c.mustMemorize);
  if (memorizeList.length > 0) {
    const practiceHeading = el("h3", { class: "fridge-section-heading" });
    practiceHeading.textContent = "Practice These by Heart";
    container.appendChild(practiceHeading);

    for (const contact of memorizeList) {
      const row = el("div", { class: "fridge-contact-row" });
      const name = el("span", { class: "fridge-contact-name" });
      name.textContent = contact.name;
      const phone = el("span", { class: "fridge-contact-phone" });
      phone.textContent = format(contact.phone);
      row.appendChild(name);
      row.appendChild(phone);
      container.appendChild(row);
    }
  }

  // Footer with printed date
  const footer = el("p", { class: "fridge-footer" });
  footer.textContent = `Printed ${localIsoDate()} · All data is stored locally on your device.`;
  container.appendChild(footer);
}

// ---------------------------------------------------------------------------
// Print triggers
// Sets a class on <body> to select which layout prints, calls window.print(),
// then removes the class on the afterprint event.
// ---------------------------------------------------------------------------

function printWallet(): void {
  buildWallet();
  document.body.classList.add("printing-wallet");
  window.print();
}

function printFridge(): void {
  buildFridge();
  document.body.classList.add("printing-fridge");
  window.print();
}

window.addEventListener("afterprint", () => {
  document.body.classList.remove("printing-wallet");
  document.body.classList.remove("printing-fridge");
});

// ---------------------------------------------------------------------------
// On-screen preview (screen-only, never prints)
// ---------------------------------------------------------------------------

function renderPreviewScreenOnly(): void {
  const state = loadState();

  const walletPreviewEl = document.querySelector<HTMLElement>(".wallet-preview");
  if (walletPreviewEl) {
    walletPreviewEl.innerHTML = "";

    // Helper: build a preview row for a real phone number.
    // Name truncates when space is tight; number never wraps or shrinks.
    function walletPreviewRow(nameText: string, phoneText: string): HTMLElement {
      const row = el("div", { class: "wallet-row-preview" });
      const nameSpan = el("span", { class: "wallet-row-name" });
      nameSpan.textContent = nameText;
      const phoneSpan = el("span", { class: "wallet-row-phone" });
      phoneSpan.textContent = phoneText;
      row.appendChild(nameSpan);
      row.appendChild(phoneSpan);
      return row;
    }

    // Helper: build a preview row for a text value (meeting place, fallback).
    // Label is bold; value wraps naturally instead of using the nowrap phone span.
    function walletPreviewTextRow(labelText: string, valueText: string): HTMLElement {
      const row = el("div", { class: "wallet-row-preview wallet-row-preview--text" });
      const labelSpan = el("span", { class: "wallet-row-label" });
      labelSpan.textContent = labelText;
      const valueSpan = el("span", { class: "wallet-row-value" });
      valueSpan.textContent = valueText;
      row.appendChild(labelSpan);
      row.appendChild(valueSpan);
      return row;
    }

    const frontPreview = el("div", { class: "wallet-face-preview" });
    const frontLabel = el("p", { class: "wallet-face-label" });
    frontLabel.textContent = "Front";
    frontPreview.appendChild(frontLabel);

    frontPreview.appendChild(walletPreviewRow("Emergency", "911"));

    const mustMemorize = state.contacts.filter((c) => c.mustMemorize).slice(0, 5);
    for (const c of mustMemorize) {
      frontPreview.appendChild(walletPreviewRow(c.name, format(c.phone)));
    }
    if (mustMemorize.length === 0) {
      const empty = el("p", { class: "wallet-preview-empty" });
      empty.textContent =
        "No must-memorize contacts yet. Flag contacts in the Directory.";
      frontPreview.appendChild(empty);
    }

    const backPreview = el("div", { class: "wallet-face-preview" });
    const backLabel = el("p", { class: "wallet-face-label" });
    backLabel.textContent = "Back";
    backPreview.appendChild(backLabel);

    if (state.plan.meetingPlace) {
      backPreview.appendChild(walletPreviewTextRow("Meet:", state.plan.meetingPlace));
    }
    if (state.plan.fallback) {
      backPreview.appendChild(walletPreviewTextRow("Fallback:", state.plan.fallback));
    }
    for (const ec of EMERGENCY_CONTACTS) {
      if (ec.phone === "911") continue;
      backPreview.appendChild(walletPreviewRow(ec.name, format(ec.phone)));
    }

    walletPreviewEl.appendChild(frontPreview);
    walletPreviewEl.appendChild(backPreview);
  }

  const fridgePreviewEl = document.querySelector<HTMLElement>(".fridge-preview");
  if (fridgePreviewEl) {
    fridgePreviewEl.innerHTML = "";

    const fridgeTitle = el("p", { class: "fridge-preview-title" });
    fridgeTitle.textContent = "Our Dead Phone Directory";
    fridgePreviewEl.appendChild(fridgeTitle);

    const total = state.contacts.length;
    const memorize = state.contacts.filter((c) => c.mustMemorize).length;
    const countLine = el("p", { class: "fridge-preview-meta" });
    countLine.textContent = `${total} contact${total !== 1 ? "s" : ""} · ${memorize} to memorize · ${EMERGENCY_CONTACTS.length} emergency numbers`;
    fridgePreviewEl.appendChild(countLine);

    if (state.plan.meetingPlace || state.plan.fallback) {
      const planLine = el("p", { class: "fridge-preview-meta" });
      planLine.textContent = `Plan: ${state.plan.meetingPlace || "(no meeting place)"} · Fallback: ${state.plan.fallback || "(none)"}`;
      fridgePreviewEl.appendChild(planLine);
    }

    const dateLine = el("p", { class: "fridge-preview-meta" });
    dateLine.textContent = `Printed date: ${localIsoDate()}`;
    fridgePreviewEl.appendChild(dateLine);
  }
}

// ---------------------------------------------------------------------------
// Public: initPrint
// ---------------------------------------------------------------------------

export function initPrint(): void {
  const area = document.getElementById("print-actions");
  if (!area) return;

  area.innerHTML = "";

  const desc = el("p", { class: "print-description" });
  desc.textContent =
    "Print a wallet card to keep in your wallet, or a fridge sheet to post at home.";
  area.appendChild(desc);

  const btnGroup = el("div", { class: "print-btn-group" });

  const walletBtn = el<HTMLButtonElement>("button", {
    type: "button",
    class: "btn btn-primary",
    id: "btn-print-wallet",
  });
  walletBtn.textContent = "Print wallet card";
  walletBtn.addEventListener("click", printWallet);

  const fridgeBtn = el<HTMLButtonElement>("button", {
    type: "button",
    class: "btn btn-primary",
    id: "btn-print-fridge",
  });
  fridgeBtn.textContent = "Print fridge sheet";
  fridgeBtn.addEventListener("click", printFridge);

  btnGroup.appendChild(walletBtn);
  btnGroup.appendChild(fridgeBtn);
  area.appendChild(btnGroup);

  const scaleHint = el("p", { class: "print-scale-hint" });
  scaleHint.textContent =
    "For a true-size card, print at 100% scale (Actual size), not Fit to page.";
  area.appendChild(scaleHint);

  // Wallet card preview section
  const walletPreviewSection = el("div", { class: "print-preview-section" });
  const walletPreviewHeading = el("h3", { class: "print-preview-heading" });
  walletPreviewHeading.textContent = "Wallet card preview";
  walletPreviewSection.appendChild(walletPreviewHeading);

  const walletPreviewNote = el("p", { class: "print-preview-note" });
  walletPreviewNote.textContent =
    "Front: up to 5 must-memorize contacts + 911. Back: meeting place, fallback, 988, Poison Control.";
  walletPreviewSection.appendChild(walletPreviewNote);

  walletPreviewSection.appendChild(el("div", { class: "wallet-preview" }));
  area.appendChild(walletPreviewSection);

  // Fridge sheet preview section
  const fridgePreviewSection = el("div", { class: "print-preview-section" });
  const fridgePreviewHeading = el("h3", { class: "print-preview-heading" });
  fridgePreviewHeading.textContent = "Fridge sheet preview";
  fridgePreviewSection.appendChild(fridgePreviewHeading);

  fridgePreviewSection.appendChild(el("div", { class: "fridge-preview" }));
  area.appendChild(fridgePreviewSection);

  renderPreviewScreenOnly();
}
