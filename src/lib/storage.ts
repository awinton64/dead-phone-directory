import { normalise, PhoneError } from "./phone.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Box = 1 | 2 | 3 | 4 | 5;

export interface Contact {
  id: string;
  name: string;        // 1–60 chars
  relation: string;    // 1–40 chars
  phone: string;       // normalised digits only (or service number)
  mustMemorize: boolean;
  box: Box;
  nextDue: string;     // YYYY-MM-DD
}

export interface HouseholdPlan {
  meetingPlace: string; // 0–200 chars
  fallback: string;     // 0–200 chars
}

export interface DrillLogEntry {
  date: string;    // YYYY-MM-DD
  correct: number;
  incorrect: number;
}

export interface AppState {
  version: 1;
  contacts: Contact[];
  plan: HouseholdPlan;
  drillLog: DrillLogEntry[];
  theme: "light" | "dark" | "system";
}

// ---------------------------------------------------------------------------
// Emergency contacts (compile-time constant, never stored in AppState)
// ---------------------------------------------------------------------------

export const EMERGENCY_CONTACTS = [
  { name: "Emergency",                 phone: "911" },
  { name: "Suicide & Crisis Lifeline", phone: "988" },
  { name: "Poison Control",            phone: "18002221222" },
] as const;

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof (crypto as { randomUUID?: unknown }).randomUUID === "function"
  ) {
    return (crypto as { randomUUID: () => string }).randomUUID();
  }
  // Fallback: hex timestamp + random suffix
  const ts = Date.now().toString(16);
  const rnd = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  return `${ts}-${rnd}`;
}

// ---------------------------------------------------------------------------
// Storage key and Storage-like interface
// ---------------------------------------------------------------------------

const STORAGE_KEY = "dpd_v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// ---------------------------------------------------------------------------
// emptyState / demoState
// ---------------------------------------------------------------------------

export function emptyState(): AppState {
  return {
    version: 1,
    contacts: [],
    plan: { meetingPlace: "", fallback: "" },
    drillLog: [],
    theme: "system",
  };
}

export function demoState(): AppState {
  const today = localIsoDate();
  // 555-01xx numbers use a real-looking area code (212) so NANP validation
  // passes: area=212 (2–9 ✓), exchange=555 (5 ✓), subscriber=01xx.
  const contacts: Contact[] = [
    {
      id: generateId(),
      name: "Mom (demo)",
      relation: "Mother",
      phone: normalise("(212) 555-0101"),
      mustMemorize: true,
      box: 1,
      nextDue: today,
    },
    {
      id: generateId(),
      name: "Dad (demo)",
      relation: "Father",
      phone: normalise("(212) 555-0102"),
      mustMemorize: true,
      box: 1,
      nextDue: today,
    },
    {
      id: generateId(),
      name: "Aunt Mavis (demo)",
      relation: "Aunt",
      phone: normalise("(212) 555-0103"),
      mustMemorize: true,
      box: 1,
      nextDue: today,
    },
    {
      id: generateId(),
      name: "Uncle Herb (demo)",
      relation: "Uncle",
      phone: normalise("(212) 555-0104"),
      mustMemorize: false,
      box: 1,
      nextDue: today,
    },
    {
      id: generateId(),
      name: "Neighbor Dolores (demo)",
      relation: "Neighbor",
      phone: normalise("(212) 555-0105"),
      mustMemorize: false,
      box: 1,
      nextDue: today,
    },
  ];

  return {
    version: 1,
    contacts,
    plan: {
      meetingPlace: "Front yard oak tree (demo)",
      fallback: "Dolores next door: 555-0105 (demo)",
    },
    drillLog: [],
    theme: "system",
  };
}

// ---------------------------------------------------------------------------
// loadState / saveState
// ---------------------------------------------------------------------------

export function loadState(store: StorageLike = globalThis.localStorage): AppState {
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (raw === null) return emptyState();
    return importState(JSON.parse(raw) as unknown);
  } catch {
    return emptyState();
  }
}

export function saveState(
  state: AppState,
  store: StorageLike = globalThis.localStorage
): void {
  store.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------------------------------------------------------------------------
// exportState / importState
// ---------------------------------------------------------------------------

export function exportState(state: AppState): string {
  return JSON.stringify(state);
}

export function importState(json: unknown): AppState {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error("importState: root value must be an object");
  }

  const obj = json as Record<string, unknown>;

  // version is required and must be 1
  if (!("version" in obj)) {
    throw new Error("importState: missing version field");
  }
  if (obj["version"] !== 1) {
    throw new Error(`importState: unsupported version ${String(obj["version"])}`);
  }

  // contacts
  if (!Array.isArray(obj["contacts"])) {
    throw new Error("importState: contacts must be an array");
  }
  if (obj["contacts"].length > 10) {
    throw new Error("importState: contacts may not exceed 10 entries");
  }
  const contacts: Contact[] = (obj["contacts"] as unknown[]).map(
    (c, i) => validateContact(c, i)
  );

  // plan
  const plan = validatePlan(obj["plan"]);

  // drillLog
  if (!Array.isArray(obj["drillLog"])) {
    throw new Error("importState: drillLog must be an array");
  }
  const drillLog: DrillLogEntry[] = (obj["drillLog"] as unknown[]).map(
    (e, i) => validateDrillLogEntry(e, i)
  );

  // theme
  const theme = validateTheme(obj["theme"]);

  return { version: 1, contacts, plan, drillLog, theme };
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BOXES: Box[] = [1, 2, 3, 4, 5];

function validateContact(raw: unknown, idx: number): Contact {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`importState: contact[${idx}] must be an object`);
  }
  const c = raw as Record<string, unknown>;

  const id = requireString(c["id"], `contact[${idx}].id`);
  const name = requireString(c["name"], `contact[${idx}].name`);
  if (name.length < 1 || name.length > 60) {
    throw new Error(`importState: contact[${idx}].name must be 1–60 chars`);
  }
  const relation = requireString(c["relation"], `contact[${idx}].relation`);
  if (relation.length < 1 || relation.length > 40) {
    throw new Error(`importState: contact[${idx}].relation must be 1–40 chars`);
  }

  // Validate phone via normalise: it must already be normalised (digits only),
  // but we re-run normalise to confirm it is a valid number.
  const rawPhone = requireString(c["phone"], `contact[${idx}].phone`);
  let phone: string;
  try {
    phone = normalise(rawPhone);
  } catch (e) {
    if (e instanceof PhoneError) {
      throw new Error(`importState: contact[${idx}].phone invalid: ${e.message}`);
    }
    throw e;
  }

  if (typeof c["mustMemorize"] !== "boolean") {
    throw new Error(`importState: contact[${idx}].mustMemorize must be boolean`);
  }

  if (!BOXES.includes(c["box"] as Box)) {
    throw new Error(`importState: contact[${idx}].box must be 1–5`);
  }

  const nextDue = requireString(c["nextDue"], `contact[${idx}].nextDue`);
  if (!ISO_DATE_RE.test(nextDue)) {
    throw new Error(`importState: contact[${idx}].nextDue must be YYYY-MM-DD`);
  }

  return {
    id,
    name,
    relation,
    phone,
    mustMemorize: c["mustMemorize"] as boolean,
    box: c["box"] as Box,
    nextDue,
  };
}

function validatePlan(raw: unknown): HouseholdPlan {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("importState: plan must be an object");
  }
  const p = raw as Record<string, unknown>;
  const meetingPlace = requireString(p["meetingPlace"], "plan.meetingPlace");
  if (meetingPlace.length > 200) {
    throw new Error("importState: plan.meetingPlace must be ≤200 chars");
  }
  const fallback = requireString(p["fallback"], "plan.fallback");
  if (fallback.length > 200) {
    throw new Error("importState: plan.fallback must be ≤200 chars");
  }
  return { meetingPlace, fallback };
}

function validateDrillLogEntry(raw: unknown, idx: number): DrillLogEntry {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`importState: drillLog[${idx}] must be an object`);
  }
  const e = raw as Record<string, unknown>;
  const date = requireString(e["date"], `drillLog[${idx}].date`);
  if (!ISO_DATE_RE.test(date)) {
    throw new Error(`importState: drillLog[${idx}].date must be YYYY-MM-DD`);
  }
  if (typeof e["correct"] !== "number" || !Number.isInteger(e["correct"]) || e["correct"] < 0) {
    throw new Error(`importState: drillLog[${idx}].correct must be a non-negative integer`);
  }
  if (typeof e["incorrect"] !== "number" || !Number.isInteger(e["incorrect"]) || e["incorrect"] < 0) {
    throw new Error(`importState: drillLog[${idx}].incorrect must be a non-negative integer`);
  }
  return { date, correct: e["correct"] as number, incorrect: e["incorrect"] as number };
}

function validateTheme(raw: unknown): "light" | "dark" | "system" {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system"; // graceful default for unknown theme values
}

function requireString(val: unknown, field: string): string {
  if (typeof val !== "string") {
    throw new Error(`importState: ${field} must be a string`);
  }
  return val;
}

// ---------------------------------------------------------------------------
// Local ISO date helper (no browser globals)
// ---------------------------------------------------------------------------

function localIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
