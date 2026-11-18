import { format, normalise, PhoneError } from "../lib/phone.ts";
import { EMERGENCY_CONTACTS, type AppState, type Contact } from "../lib/storage.ts";

type SaveCallback = (state: AppState) => void;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function el<T extends HTMLElement>(tag: string, attrs: Record<string, string> = {}, ...children: (Node | string)[]): T {
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

function setText(node: HTMLElement, text: string): void {
  node.textContent = text;
}

function localIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// Render emergency contacts
// ---------------------------------------------------------------------------

function renderEmergency(container: HTMLElement): void {
  container.innerHTML = "";

  const section = el("div", { class: "emergency-section" });
  const heading = el("h3");
  setText(heading, "Emergency Numbers");
  section.appendChild(heading);

  for (const ec of EMERGENCY_CONTACTS) {
    const row = el("div", { class: "emergency-row" });

    const nameEl = el("span", { class: "emergency-name" });
    setText(nameEl, ec.name);

    const phoneEl = el("span", { class: "emergency-phone" });
    setText(phoneEl, format(ec.phone));

    row.appendChild(nameEl);
    row.appendChild(phoneEl);
    section.appendChild(row);
  }

  container.appendChild(section);
}

// ---------------------------------------------------------------------------
// Render contact list (alphabetically grouped)
// ---------------------------------------------------------------------------

function renderContacts(
  listContainer: HTMLElement,
  alphaContainer: HTMLElement | null,
  contacts: Contact[],
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
): void {
  listContainer.innerHTML = "";

  if (contacts.length === 0) {
    const empty = el("p", { class: "empty-state" });
    setText(empty, "No contacts yet. Add your first contact below.");
    listContainer.appendChild(empty);
    if (alphaContainer) alphaContainer.innerHTML = "";
    return;
  }

  // Group by first letter
  const groups = new Map<string, Contact[]>();
  for (const contact of [...contacts].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  )) {
    const letter = contact.name[0]!.toUpperCase();
    const key = /^[A-Z]$/.test(letter) ? letter : "#";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(contact);
  }

  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  // Alphabet index tabs
  if (alphaContainer) {
    alphaContainer.innerHTML = "";
    alphaContainer.setAttribute("aria-label", "Alphabetical index");
    for (const key of sortedKeys) {
      const tab = el("span", { class: "alpha-tab", "data-active": "true", "aria-hidden": "true" });
      setText(tab, key);
      alphaContainer.appendChild(tab);
    }
  }

  // Grouped contact rows
  for (const key of sortedKeys) {
    const group = el("div", { class: "contact-group" });

    const letterHeading = el("h3", { class: "contact-group-letter" });
    setText(letterHeading, key);
    group.appendChild(letterHeading);

    const list = el("div", { class: "contact-list", role: "list" });

    for (const contact of groups.get(key)!) {
      const row = renderContactRow(contact, onEdit, onDelete);
      list.appendChild(row);
    }

    group.appendChild(list);
    listContainer.appendChild(group);
  }
}

function renderContactRow(
  contact: Contact,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
): HTMLElement {
  const row = el("div", { class: "contact-row", role: "listitem" });

  const info = el("div", { class: "contact-info" });

  const nameEl = el("span", { class: "contact-name" });
  setText(nameEl, contact.name);
  info.appendChild(nameEl);

  const meta = el("div");

  const relationEl = el("span", { class: "contact-relation" });
  setText(relationEl, contact.relation);
  meta.appendChild(relationEl);

  if (contact.mustMemorize) {
    const badge = el("span", { class: "badge-memorize", "aria-label": "Must memorize" });
    setText(badge, "★ Memorize");
    meta.appendChild(document.createTextNode(" "));
    meta.appendChild(badge);
  }

  info.appendChild(meta);

  const phoneEl = el("span", { class: "contact-phone" });
  setText(phoneEl, format(contact.phone));

  const actions = el("div", { class: "contact-actions" });

  const editBtn = el<HTMLButtonElement>("button", {
    class: "btn btn-secondary btn-sm",
    type: "button",
    "aria-label": `Edit ${contact.name}`,
  });
  setText(editBtn, "Edit");
  editBtn.addEventListener("click", () => onEdit(contact.id));

  const deleteBtn = el<HTMLButtonElement>("button", {
    class: "btn btn-danger btn-sm",
    type: "button",
    "aria-label": `Delete ${contact.name}`,
  });
  setText(deleteBtn, "Delete");
  deleteBtn.addEventListener("click", () => onDelete(contact.id));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  row.appendChild(info);
  row.appendChild(phoneEl);
  row.appendChild(actions);

  return row;
}

// ---------------------------------------------------------------------------
// Add / edit form
// ---------------------------------------------------------------------------

interface FormValues {
  name: string;
  relation: string;
  phone: string;
  mustMemorize: boolean;
}

function renderForm(
  wrapper: HTMLElement,
  initial: Partial<FormValues> & { isEdit?: boolean; id?: string },
  onSubmit: (values: FormValues, id?: string) => void,
  onCancel: () => void,
): void {
  wrapper.innerHTML = "";

  const form = el<HTMLFormElement>("form", {
    class: "contact-form-wrapper",
    novalidate: "",
    "aria-label": initial.isEdit ? "Edit contact" : "Add contact",
  });

  const heading = el("h3");
  setText(heading, initial.isEdit ? "Edit Contact" : "Add Contact");
  form.appendChild(heading);

  // Error alert region
  const alertEl = el("div", { role: "alert", "aria-live": "assertive", class: "field-error" });
  alertEl.style.marginBottom = "var(--space-3)";
  form.appendChild(alertEl);

  // Name
  const nameGroup = el("div", { class: "form-group" });
  const nameLabel = el("label", { for: "contact-name" });
  setText(nameLabel, "Name");
  const nameInput = el<HTMLInputElement>("input", {
    type: "text",
    id: "contact-name",
    name: "name",
    maxlength: "60",
    required: "",
    autocomplete: "off",
  });
  if (initial.name) nameInput.value = initial.name;
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  form.appendChild(nameGroup);

  // Relation
  const relGroup = el("div", { class: "form-group" });
  const relLabel = el("label", { for: "contact-relation" });
  setText(relLabel, "Relation");
  const relInput = el<HTMLInputElement>("input", {
    type: "text",
    id: "contact-relation",
    name: "relation",
    maxlength: "40",
    required: "",
    autocomplete: "off",
  });
  if (initial.relation) relInput.value = initial.relation;
  relGroup.appendChild(relLabel);
  relGroup.appendChild(relInput);
  form.appendChild(relGroup);

  // Phone
  const phoneGroup = el("div", { class: "form-group" });
  const phoneLabel = el("label", { for: "contact-phone" });
  setText(phoneLabel, "Phone number");
  const phoneInput = el<HTMLInputElement>("input", {
    type: "tel",
    id: "contact-phone",
    name: "phone",
    required: "",
    autocomplete: "off",
    placeholder: "(555) 555-5555",
  });
  if (initial.phone) {
    // Display formatted value in the input
    try {
      phoneInput.value = format(initial.phone);
    } catch {
      phoneInput.value = initial.phone;
    }
  }
  const phoneError = el("span", { class: "field-error", id: "contact-phone-error", role: "alert" });
  phoneGroup.appendChild(phoneLabel);
  phoneGroup.appendChild(phoneInput);
  phoneGroup.appendChild(phoneError);
  form.appendChild(phoneGroup);

  // Must memorize
  const memGroup = el("div", { class: "form-group" });
  const memRow = el("div", { class: "checkbox-row" });
  const memInput = el<HTMLInputElement>("input", {
    type: "checkbox",
    id: "contact-memorize",
    name: "mustMemorize",
  });
  if (initial.mustMemorize) memInput.checked = true;
  const memLabel = el("label", { for: "contact-memorize" });
  setText(memLabel, "Must memorize (included in daily drill)");
  memRow.appendChild(memInput);
  memRow.appendChild(memLabel);
  memGroup.appendChild(memRow);
  form.appendChild(memGroup);

  // Actions
  const actions = el("div", { class: "form-actions" });

  const submitBtn = el<HTMLButtonElement>("button", {
    type: "submit",
    class: "btn btn-primary",
  });
  setText(submitBtn, initial.isEdit ? "Save Changes" : "Add Contact");

  const cancelBtn = el<HTMLButtonElement>("button", {
    type: "button",
    class: "btn btn-secondary",
  });
  setText(cancelBtn, "Cancel");
  cancelBtn.addEventListener("click", onCancel);

  actions.appendChild(submitBtn);
  actions.appendChild(cancelBtn);
  form.appendChild(actions);

  // Validation and submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const relation = relInput.value.trim();
    const rawPhone = phoneInput.value.trim();

    // Clear previous errors
    setText(alertEl, "");
    setText(phoneError, "");
    phoneInput.removeAttribute("aria-describedby");

    let valid = true;

    if (name.length === 0) {
      setText(alertEl, "Name is required.");
      nameInput.focus();
      valid = false;
    } else if (name.length > 60) {
      setText(alertEl, "Name must be 60 characters or fewer.");
      nameInput.focus();
      valid = false;
    }

    if (valid && relation.length === 0) {
      setText(alertEl, "Relation is required.");
      relInput.focus();
      valid = false;
    } else if (valid && relation.length > 40) {
      setText(alertEl, "Relation must be 40 characters or fewer.");
      relInput.focus();
      valid = false;
    }

    let normalisedPhone = "";
    if (valid) {
      try {
        normalisedPhone = normalise(rawPhone);
      } catch (err) {
        const msg = err instanceof PhoneError
          ? err.message
          : "Invalid phone number.";
        setText(phoneError, msg);
        phoneInput.setAttribute("aria-describedby", "contact-phone-error");
        phoneInput.focus();
        valid = false;
      }
    }

    if (!valid) return;

    onSubmit(
      { name, relation, phone: normalisedPhone, mustMemorize: memInput.checked },
      initial.id,
    );
  });

  wrapper.appendChild(form);
  // Focus the first input
  nameInput.focus();
}

// ---------------------------------------------------------------------------
// Delete confirmation
// ---------------------------------------------------------------------------

function confirmDelete(
  wrapper: HTMLElement,
  contact: Contact,
  onConfirm: () => void,
  onCancel: () => void,
): void {
  wrapper.innerHTML = "";

  const box = el("div", {
    class: "contact-form-wrapper",
    role: "alertdialog",
    "aria-labelledby": "delete-confirm-heading",
    "aria-modal": "false",
  });

  const heading = el("h3", { id: "delete-confirm-heading" });
  setText(heading, "Delete contact?");
  box.appendChild(heading);

  const msg = el("p");
  msg.style.marginBottom = "var(--space-4)";
  const nameStrong = el("strong");
  setText(nameStrong, contact.name);
  msg.appendChild(document.createTextNode("Remove "));
  msg.appendChild(nameStrong);
  msg.appendChild(document.createTextNode(" from your directory? This cannot be undone."));
  box.appendChild(msg);

  const actions = el("div", { class: "form-actions" });

  const confirmBtn = el<HTMLButtonElement>("button", {
    type: "button",
    class: "btn btn-danger",
  });
  setText(confirmBtn, "Delete");
  confirmBtn.addEventListener("click", onConfirm);

  const cancelBtn = el<HTMLButtonElement>("button", {
    type: "button",
    class: "btn btn-secondary",
  });
  setText(cancelBtn, "Cancel");
  cancelBtn.addEventListener("click", onCancel);

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);
  box.appendChild(actions);
  wrapper.appendChild(box);
  confirmBtn.focus();
}

// ---------------------------------------------------------------------------
// Count indicator
// ---------------------------------------------------------------------------

function renderCount(el: HTMLElement, count: number): void {
  if (count >= 10) {
    el.className = "contact-count contact-count-max";
    el.textContent = `${count}/10 contacts (maximum reached)`;
  } else {
    el.className = "contact-count";
    el.textContent = `${count}/10 contacts`;
  }
}

// ---------------------------------------------------------------------------
// Public: initContacts
// ---------------------------------------------------------------------------

export function initContacts(state: AppState, onSave: SaveCallback): void {
  const listContainer = document.getElementById("contacts-list");
  const emergencyContainer = document.getElementById("emergency-list");
  const formArea = document.getElementById("contacts-form-area");
  const addBtnArea = document.getElementById("contacts-add-area");

  if (!listContainer || !emergencyContainer) return;

  // Alpha index container (must exist before add area is placed)
  let alphaEl = document.getElementById("contacts-alpha");
  if (!alphaEl) {
    alphaEl = document.createElement("div");
    alphaEl.id = "contacts-alpha";
    alphaEl.className = "alpha-index";
    listContainer.before(alphaEl);
  }

  // Ensure the add button container sits above the alpha index
  let addArea = addBtnArea;
  if (!addArea) {
    addArea = document.createElement("div");
    addArea.id = "contacts-add-area";
    alphaEl.before(addArea);
  }

  let formAreaEl = formArea;
  if (!formAreaEl) {
    formAreaEl = document.createElement("div");
    formAreaEl.id = "contacts-form-area";
    addArea.after(formAreaEl);
  }

  // Count indicator
  let countEl = document.getElementById("contacts-count");
  if (!countEl) {
    countEl = document.createElement("p");
    countEl.id = "contacts-count";
    addArea.before(countEl);
  }

  function rerender(): void {
    renderContacts(
      listContainer!,
      alphaEl,
      state.contacts,
      (id) => startEdit(id),
      (id) => startDelete(id),
    );
    renderEmergency(emergencyContainer!);
    renderCount(countEl!, state.contacts.length);
    renderAddButton();
  }

  function renderAddButton(): void {
    addArea!.innerHTML = "";
    if (state.contacts.length >= 10) {
      const msg = el("p", { class: "contact-count contact-count-max" });
      setText(msg, "Maximum of 10 contacts reached.");
      addArea!.appendChild(msg);
      return;
    }
    const btn = el<HTMLButtonElement>("button", {
      type: "button",
      class: "btn btn-primary",
      id: "btn-add-contact",
    });
    setText(btn, "+ Add Contact");
    btn.addEventListener("click", () => startAdd());
    addArea!.appendChild(btn);
  }

  function startAdd(): void {
    renderForm(
      formAreaEl!,
      {},
      (values) => {
        const today = localIsoDate();
        const newContact: Contact = {
          id: crypto.randomUUID(),
          name: values.name,
          relation: values.relation,
          phone: values.phone,
          mustMemorize: values.mustMemorize,
          box: 1,
          nextDue: today,
        };
        state.contacts.push(newContact);
        onSave(state);
        formAreaEl!.innerHTML = "";
        rerender();
      },
      () => {
        formAreaEl!.innerHTML = "";
        rerender();
      },
    );
    formAreaEl!.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function startEdit(id: string): void {
    const contact = state.contacts.find((c) => c.id === id);
    if (!contact) return;
    renderForm(
      formAreaEl!,
      { ...contact, isEdit: true, id: contact.id },
      (values, editId) => {
        const idx = state.contacts.findIndex((c) => c.id === editId);
        if (idx === -1) return;
        state.contacts[idx] = {
          ...state.contacts[idx]!,
          name: values.name,
          relation: values.relation,
          phone: values.phone,
          mustMemorize: values.mustMemorize,
        };
        onSave(state);
        formAreaEl!.innerHTML = "";
        rerender();
      },
      () => {
        formAreaEl!.innerHTML = "";
        rerender();
      },
    );
    formAreaEl!.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function startDelete(id: string): void {
    const contact = state.contacts.find((c) => c.id === id);
    if (!contact) return;
    confirmDelete(
      formAreaEl!,
      contact,
      () => {
        state.contacts = state.contacts.filter((c) => c.id !== id);
        onSave(state);
        formAreaEl!.innerHTML = "";
        rerender();
      },
      () => {
        formAreaEl!.innerHTML = "";
      },
    );
    formAreaEl!.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  rerender();
}
