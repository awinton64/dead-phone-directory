import { normalise, format, PhoneError } from "../lib/phone.ts";
import { isDue, recordCorrect, recordIncorrect } from "../lib/scheduler.ts";
import { computeStreak } from "../lib/streak.ts";
import type { AppState, Contact } from "../lib/storage.ts";

type SaveCallback = (state: AppState) => void;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function localIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

// ---------------------------------------------------------------------------
// Streak display (T10)
// ---------------------------------------------------------------------------

export function renderStreak(state: AppState): void {
  const container = document.getElementById("streak-display");
  if (!container) return;

  const today = localIsoDate();
  const dates = state.drillLog.map((e) => e.date);
  const { current, longest } = computeStreak(dates, today);

  container.innerHTML = "";

  const bar = el("div", { class: "streak-bar" });

  // Current streak
  const currentItem = el("div", { class: "streak-item" });
  const currentVal = el("span", { class: "streak-value" });
  currentVal.textContent = String(current);
  const currentLabel = el("span", { class: "streak-label" });
  currentLabel.textContent = "Day streak";
  currentItem.appendChild(currentVal);
  currentItem.appendChild(currentLabel);

  // Candle icons: up to 7, one per day
  const candleCount = Math.min(current, 7);
  if (candleCount > 0) {
    const candleRow = el("div", { class: "streak-candles" });
    const candleLabel = el("span", { class: "sr-only" });
    candleLabel.textContent = `${candleCount} candle${candleCount !== 1 ? "s" : ""} lit`;
    candleRow.appendChild(candleLabel);
    for (let i = 0; i < candleCount; i++) {
      const candle = el("span", { "aria-hidden": "true", class: "streak-candle" });
      candle.textContent = "🕯";
      candleRow.appendChild(candle);
    }
    bar.appendChild(candleRow);
  }

  // Longest streak
  const longestItem = el("div", { class: "streak-item" });
  const longestVal = el("span", { class: "streak-value" });
  longestVal.textContent = String(longest);
  const longestLabel = el("span", { class: "streak-label" });
  longestLabel.textContent = "Longest";
  longestItem.appendChild(longestVal);
  longestItem.appendChild(longestLabel);

  bar.appendChild(currentItem);
  bar.appendChild(longestItem);
  container.appendChild(bar);
}

// ---------------------------------------------------------------------------
// Session logic
// ---------------------------------------------------------------------------

const SESSION_MAX = 5;

function getDueContacts(contacts: Contact[], today: string): Contact[] {
  return contacts
    .filter((c) => c.mustMemorize && isDue(c.nextDue, today))
    .sort((a, b) => {
      if (a.nextDue < b.nextDue) return -1;
      if (a.nextDue > b.nextDue) return 1;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .slice(0, SESSION_MAX);
}

function getNextDueDate(contacts: Contact[], today: string): string | null {
  const future = contacts
    .filter((c) => c.mustMemorize && c.nextDue > today)
    .map((c) => c.nextDue)
    .sort();
  return future[0] ?? null;
}

// ---------------------------------------------------------------------------
// Render: start screen
// ---------------------------------------------------------------------------

function renderStart(
  container: HTMLElement,
  dueCount: number,
  hasFlaggedContacts: boolean,
  nextDue: string | null,
  today: string,
  onStart: () => void,
  onPractice: () => void,
): void {
  container.innerHTML = "";

  if (!hasFlaggedContacts) {
    const msg = el("div", { class: "drill-nothing-due" });
    msg.innerHTML =
      '<p>No contacts are flagged "Must memorize" yet.</p>' +
      "<p>Go to the Directory, edit a contact, and tick <strong>Must memorize</strong> to include it in the drill.</p>";
    container.appendChild(msg);
    return;
  }

  const wrap = el("div", { class: "drill-start" });

  const tagline = el("p");
  tagline.textContent = "Your phone just died. Who can you still call?";

  if (dueCount > 0) {
    const dueMsg = el("p");
    dueMsg.textContent = `${dueCount} number${dueCount !== 1 ? "s" : ""} due for review today.`;
    wrap.appendChild(tagline);
    wrap.appendChild(dueMsg);

    const startBtn = el<HTMLButtonElement>("button", {
      type: "button",
      class: "btn btn-primary",
    });
    startBtn.textContent = "Start Drill";
    startBtn.addEventListener("click", onStart);
    wrap.appendChild(startBtn);
  } else {
    // Nothing due today
    const noneMsg = el("p");
    if (nextDue) {
      noneMsg.textContent = `All caught up! Next review due on ${nextDue}.`;
    } else {
      noneMsg.textContent = "All caught up! No upcoming reviews.";
    }
    wrap.appendChild(tagline);
    wrap.appendChild(noneMsg);

    const practiceBtn = el<HTMLButtonElement>("button", {
      type: "button",
      class: "btn btn-secondary",
    });
    practiceBtn.textContent = "Practice anyway";
    practiceBtn.addEventListener("click", onPractice);
    wrap.appendChild(practiceBtn);
  }

  container.appendChild(wrap);
}

// ---------------------------------------------------------------------------
// Render: single drill card
// ---------------------------------------------------------------------------

function renderCard(
  container: HTMLElement,
  contact: Contact,
  cardIndex: number,
  totalCards: number,
  feedbackEl: HTMLElement,
  onAnswer: (input: string) => void,
): HTMLInputElement {
  container.innerHTML = "";
  feedbackEl.removeAttribute("data-visible");
  feedbackEl.removeAttribute("data-result");
  feedbackEl.textContent = "";

  const card = el("div", { class: "drill-card" });

  const progress = el("p", { class: "drill-progress" });
  progress.textContent = `${cardIndex + 1} of ${totalCards}`;
  card.appendChild(progress);

  const prompt = el("p", { class: "drill-prompt" });
  prompt.textContent = contact.name;
  card.appendChild(prompt);

  const relation = el("p", { class: "drill-relation" });
  relation.textContent = contact.relation;
  card.appendChild(relation);

  const inputGroup = el("div", { class: "drill-input-group" });
  const formGroup = el("div", { class: "form-group" });

  const labelId = `drill-label-${cardIndex}`;
  const inputId = `drill-input-${cardIndex}`;
  const inputLabel = el("label", { for: inputId, id: labelId });
  inputLabel.textContent = "Enter their phone number";

  const input = el<HTMLInputElement>("input", {
    type: "tel",
    id: inputId,
    class: "drill-input",
    inputmode: "numeric",
    autocomplete: "off",
    "aria-labelledby": labelId,
  });

  formGroup.appendChild(inputLabel);
  formGroup.appendChild(input);

  const submitBtn = el<HTMLButtonElement>("button", {
    type: "button",
    class: "btn btn-primary drill-submit",
  });
  submitBtn.textContent = "Submit";

  inputGroup.appendChild(formGroup);
  inputGroup.appendChild(submitBtn);
  card.appendChild(inputGroup);

  container.appendChild(card);

  function handleSubmit(): void {
    const val = input.value.trim();
    if (!val) {
      input.focus();
      return;
    }
    onAnswer(val);
  }

  submitBtn.addEventListener("click", handleSubmit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  });

  return input;
}

// ---------------------------------------------------------------------------
// Render: session complete
// ---------------------------------------------------------------------------

function renderComplete(
  container: HTMLElement,
  correct: number,
  incorrect: number,
  onRestart: () => void,
): void {
  container.innerHTML = "";

  const wrap = el("div", { class: "drill-complete" });

  const heading = el("h3");
  heading.textContent = "Session complete!";
  wrap.appendChild(heading);

  const score = el("p", { class: "drill-score" });
  score.textContent = `${correct} correct, ${incorrect} missed`;
  wrap.appendChild(score);

  const doneBtn = el<HTMLButtonElement>("button", {
    type: "button",
    class: "btn btn-primary",
  });
  doneBtn.textContent = "Done";
  doneBtn.addEventListener("click", onRestart);
  wrap.appendChild(doneBtn);

  container.appendChild(wrap);
  doneBtn.focus();
}

// ---------------------------------------------------------------------------
// Public: initDrill
// ---------------------------------------------------------------------------

export function initDrill(state: AppState, onSave: SaveCallback): void {
  const sessionContainer = document.getElementById("drill-session");
  if (!sessionContainer) return;

  const today = localIsoDate();
  const hasFlagged = state.contacts.some((c) => c.mustMemorize);

  renderStreak(state);
  startScreen();

  function startScreen(): void {
    const dueCards = getDueContacts(state.contacts, today);
    const nextDue = getNextDueDate(state.contacts, today);

    renderStart(
      sessionContainer!,
      dueCards.length,
      hasFlagged,
      nextDue,
      today,
      () => runSession(dueCards, false),
      () => {
        // Practice: use all mustMemorize contacts, regardless of due date
        const all = state.contacts
          .filter((c) => c.mustMemorize)
          .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
          .slice(0, SESSION_MAX);
        runSession(all, true);
      },
    );
  }

  function runSession(cards: Contact[], practiceMode: boolean): void {
    if (cards.length === 0) {
      startScreen();
      return;
    }

    sessionContainer!.innerHTML = "";

    // Feedback region (outside the card, persistent across cards)
    const feedbackEl = el("div", {
      class: "drill-feedback",
      "aria-live": "polite",
      "aria-atomic": "true",
      role: "status",
    });
    sessionContainer!.appendChild(feedbackEl);

    // Card container
    const cardContainer = el("div");
    sessionContainer!.appendChild(cardContainer);

    let cardIndex = 0;
    let sessionCorrect = 0;
    let sessionIncorrect = 0;

    // We need mutable copies of box/nextDue for the session
    // so we work on the state.contacts entries directly by id.

    function showCard(): void {
      const contact = cards[cardIndex]!;
      const inputEl = renderCard(
        cardContainer,
        contact,
        cardIndex,
        cards.length,
        feedbackEl,
        handleAnswer,
      );
      // Move focus to the input
      requestAnimationFrame(() => inputEl.focus());
    }

    function handleAnswer(raw: string): void {
      const contact = cards[cardIndex]!;

      let userDigits: string | null = null;
      try {
        userDigits = normalise(raw);
      } catch (e) {
        if (!(e instanceof PhoneError)) throw e;
        // invalid input → miss
      }

      const isCorrect = userDigits !== null && userDigits === contact.phone;

      if (isCorrect) {
        sessionCorrect++;
        feedbackEl.setAttribute("data-result", "correct");
        feedbackEl.setAttribute("data-visible", "true");
        feedbackEl.textContent = "✓ Correct!";
      } else {
        sessionIncorrect++;
        feedbackEl.setAttribute("data-result", "incorrect");
        feedbackEl.setAttribute("data-visible", "true");
        // Correct number stays visible until the user dismisses via Next
        feedbackEl.textContent = `✗ Missed. The number is ${format(contact.phone)}.`;
      }

      // Update scheduler unless practice mode
      if (!practiceMode) {
        const stateContact = state.contacts.find((c) => c.id === contact.id);
        if (stateContact) {
          const result = isCorrect
            ? recordCorrect(today, stateContact.box)
            : recordIncorrect(today);
          stateContact.box = result.box;
          stateContact.nextDue = result.nextDue;
        }
      }

      // Disable the submit button so the user cannot re-submit the same card
      const submitBtn = cardContainer.querySelector<HTMLButtonElement>(".drill-submit");
      if (submitBtn) submitBtn.disabled = true;
      const inputEl = cardContainer.querySelector<HTMLInputElement>(".drill-input");
      if (inputEl) inputEl.disabled = true;

      // Show a Next button: user must press it to advance (no auto-timer)
      const nextBtn = el<HTMLButtonElement>("button", {
        type: "button",
        class: "btn btn-primary drill-next",
      });
      const isLast = cardIndex === cards.length - 1;
      nextBtn.textContent = isLast ? "Finish" : "Next";
      nextBtn.addEventListener("click", () => {
        cardIndex++;
        if (cardIndex < cards.length) {
          showCard();
        } else {
          finishSession();
        }
      });

      // Append Next button after the feedback region
      feedbackEl.insertAdjacentElement("afterend", nextBtn);

      // Move focus to Next so keyboard users can proceed immediately
      requestAnimationFrame(() => nextBtn.focus());
    }

    function finishSession(): void {
      // Append drill log entry (counts for streak even in practice mode)
      const entry = {
        date: today,
        correct: sessionCorrect,
        incorrect: sessionIncorrect,
      };
      state.drillLog.push(entry);
      onSave(state);

      // Re-render streak with updated log
      renderStreak(state);

      renderComplete(
        sessionContainer!,
        sessionCorrect,
        sessionIncorrect,
        () => {
          startScreen();
        },
      );
    }

    showCard();
  }
}
