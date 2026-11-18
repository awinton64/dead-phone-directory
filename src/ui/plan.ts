import type { AppState } from "../lib/storage.ts";

type SaveCallback = (state: AppState) => void;

export function initPlan(state: AppState, onSave: SaveCallback): void {
  const formEl = document.getElementById("plan-form") as HTMLFormElement | null;
  if (!formEl) return;

  formEl.innerHTML = "";

  // ---- Meeting place ----
  const mpGroup = document.createElement("div");
  mpGroup.className = "form-group";

  const mpLabel = document.createElement("label");
  mpLabel.htmlFor = "plan-meeting-place";
  mpLabel.textContent = "Meeting place";
  mpLabel.appendChild(document.createTextNode(" "));
  const mpHint = document.createElement("span");
  mpHint.className = "contact-relation";
  mpHint.textContent = "(where everyone goes if phones are dead)";
  mpLabel.appendChild(mpHint);

  const mpInput = document.createElement("input");
  mpInput.type = "text";
  mpInput.id = "plan-meeting-place";
  mpInput.name = "meetingPlace";
  mpInput.maxLength = 200;
  mpInput.autocomplete = "off";
  mpInput.placeholder = "e.g. Front yard oak tree";
  mpInput.value = state.plan.meetingPlace;

  const mpError = document.createElement("span");
  mpError.className = "field-error";
  mpError.id = "plan-meeting-place-error";
  mpError.setAttribute("role", "alert");

  mpGroup.appendChild(mpLabel);
  mpGroup.appendChild(mpInput);
  mpGroup.appendChild(mpError);

  // ---- Fallback contact ----
  const fbGroup = document.createElement("div");
  fbGroup.className = "form-group";

  const fbLabel = document.createElement("label");
  fbLabel.htmlFor = "plan-fallback";
  fbLabel.textContent = "Fallback contact";
  fbLabel.appendChild(document.createTextNode(" "));
  const fbHint = document.createElement("span");
  fbHint.className = "contact-relation";
  fbHint.textContent = "(neighbour, landline, trusted friend)";
  fbLabel.appendChild(fbHint);

  const fbInput = document.createElement("input");
  fbInput.type = "text";
  fbInput.id = "plan-fallback";
  fbInput.name = "fallback";
  fbInput.maxLength = 200;
  fbInput.autocomplete = "off";
  fbInput.placeholder = "e.g. Dolores next door — 555-0105";
  fbInput.value = state.plan.fallback;

  const fbError = document.createElement("span");
  fbError.className = "field-error";
  fbError.id = "plan-fallback-error";
  fbError.setAttribute("role", "alert");

  fbGroup.appendChild(fbLabel);
  fbGroup.appendChild(fbInput);
  fbGroup.appendChild(fbError);

  // ---- Alert region for form-level errors ----
  const alertEl = document.createElement("div");
  alertEl.setAttribute("role", "alert");
  alertEl.setAttribute("aria-live", "assertive");
  alertEl.className = "field-error";
  alertEl.style.marginBottom = "var(--space-3)";

  // ---- Submit ----
  const actions = document.createElement("div");
  actions.className = "form-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "btn btn-primary";
  saveBtn.textContent = "Save Plan";

  const savedMsg = document.createElement("span");
  savedMsg.className = "contact-relation";
  savedMsg.setAttribute("aria-live", "polite");
  savedMsg.id = "plan-saved-msg";

  actions.appendChild(saveBtn);
  actions.appendChild(savedMsg);

  // ---- Assemble form ----
  formEl.appendChild(alertEl);
  formEl.appendChild(mpGroup);
  formEl.appendChild(fbGroup);
  formEl.appendChild(actions);

  // ---- Validation and save ----
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();

    const meetingPlace = mpInput.value.trim();
    const fallback = fbInput.value.trim();

    // Clear previous errors
    alertEl.textContent = "";
    mpError.textContent = "";
    fbError.textContent = "";
    savedMsg.textContent = "";

    let valid = true;

    if (meetingPlace.length > 200) {
      mpError.textContent = "Meeting place must be 200 characters or fewer.";
      mpInput.focus();
      valid = false;
    }

    if (valid && fallback.length > 200) {
      fbError.textContent = "Fallback contact must be 200 characters or fewer.";
      fbInput.focus();
      valid = false;
    }

    if (!valid) return;

    state.plan = { meetingPlace, fallback };
    onSave(state);

    savedMsg.textContent = "Saved.";
    // Clear confirmation after 3 seconds
    setTimeout(() => {
      savedMsg.textContent = "";
    }, 3000);
  });
}
