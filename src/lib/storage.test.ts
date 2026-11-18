import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  emptyState,
  demoState,
  loadState,
  saveState,
  importState,
  exportState,
  EMERGENCY_CONTACTS,
} from "./storage.ts";
import type { AppState, Contact, Box } from "./storage.ts";

// ---------------------------------------------------------------------------
// Minimal in-memory StorageLike for Node tests
// ---------------------------------------------------------------------------

function makeStore(initial: Record<string, string> = {}): {
  store: { getItem(k: string): string | null; setItem(k: string, v: string): void };
  data: Record<string, string>;
} {
  const data: Record<string, string> = { ...initial };
  return {
    store: {
      getItem: (k: string) => (k in data ? data[k]! : null),
      setItem: (k: string, v: string) => { data[k] = v; },
    },
    data,
  };
}

// ---------------------------------------------------------------------------
// emptyState
// ---------------------------------------------------------------------------

describe("emptyState", () => {
  it("returns version 1", () => {
    expect(emptyState().version).toBe(1);
  });
  it("has empty contacts array", () => {
    expect(emptyState().contacts).toEqual([]);
  });
  it("has empty plan strings", () => {
    const { plan } = emptyState();
    expect(plan.meetingPlace).toBe("");
    expect(plan.fallback).toBe("");
  });
  it("has empty drillLog", () => {
    expect(emptyState().drillLog).toEqual([]);
  });
  it("theme defaults to system", () => {
    expect(emptyState().theme).toBe("system");
  });
});

// ---------------------------------------------------------------------------
// demoState
// ---------------------------------------------------------------------------

describe("demoState", () => {
  it("has between 1 and 10 contacts", () => {
    const { contacts } = demoState();
    expect(contacts.length).toBeGreaterThanOrEqual(1);
    expect(contacts.length).toBeLessThanOrEqual(10);
  });

  it("all phone numbers are 555-01xx (area 212, exchange 555, subscriber 01xx)", () => {
    const { contacts } = demoState();
    for (const c of contacts) {
      // normalised: area=212, exchange=555, subscriber=01xx → 21255501xx
      expect(c.phone).toMatch(/^2125550[12]\d{2}$/);
    }
  });

  it("contact names look fictional (contain '(demo)')", () => {
    const { contacts } = demoState();
    for (const c of contacts) {
      expect(c.name).toContain("(demo)");
    }
  });

  it("at least 3 contacts are mustMemorize", () => {
    const { contacts } = demoState();
    const count = contacts.filter((c) => c.mustMemorize).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it("all contacts have box in 1–5", () => {
    const { contacts } = demoState();
    for (const c of contacts) {
      expect([1, 2, 3, 4, 5]).toContain(c.box);
    }
  });

  it("all contacts have ISO nextDue", () => {
    const { contacts } = demoState();
    for (const c of contacts) {
      expect(c.nextDue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// EMERGENCY_CONTACTS
// ---------------------------------------------------------------------------

describe("EMERGENCY_CONTACTS", () => {
  it("contains 911", () => {
    expect(EMERGENCY_CONTACTS.some((e) => e.phone === "911")).toBe(true);
  });
  it("contains 988", () => {
    expect(EMERGENCY_CONTACTS.some((e) => e.phone === "988")).toBe(true);
  });
  it("contains Poison Control", () => {
    expect(EMERGENCY_CONTACTS.some((e) => e.phone === "18002221222")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// loadState / saveState round-trip
// ---------------------------------------------------------------------------

describe("loadState / saveState", () => {
  it("returns emptyState when storage is empty", () => {
    const { store } = makeStore();
    expect(loadState(store)).toEqual(emptyState());
  });

  it("returns emptyState when stored value is corrupt JSON", () => {
    const { store } = makeStore({ dpd_v1: "not-json{{" });
    expect(loadState(store)).toEqual(emptyState());
  });

  it("returns emptyState when stored object has wrong version", () => {
    const { store } = makeStore({ dpd_v1: JSON.stringify({ version: 99 }) });
    expect(loadState(store)).toEqual(emptyState());
  });

  it("round-trips emptyState", () => {
    const { store } = makeStore();
    const state = emptyState();
    saveState(state, store);
    expect(loadState(store)).toEqual(state);
  });

  it("round-trips demoState", () => {
    const { store } = makeStore();
    const state = demoState();
    saveState(state, store);
    expect(loadState(store)).toEqual(state);
  });
});

// ---------------------------------------------------------------------------
// exportState / importState round-trip
// ---------------------------------------------------------------------------

describe("exportState / importState", () => {
  it("round-trips emptyState", () => {
    const state = emptyState();
    expect(importState(JSON.parse(exportState(state)))).toEqual(state);
  });

  it("round-trips demoState", () => {
    const state = demoState();
    expect(importState(JSON.parse(exportState(state)))).toEqual(state);
  });

  it("migration no-op: v1 stays v1", () => {
    const state = emptyState();
    const imported = importState(JSON.parse(exportState(state)));
    expect(imported.version).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// importState validation
// ---------------------------------------------------------------------------

describe("importState — rejects invalid inputs", () => {
  it("throws when version is missing", () => {
    expect(() =>
      importState({ contacts: [], plan: { meetingPlace: "", fallback: "" }, drillLog: [], theme: "system" })
    ).toThrow(/version/);
  });

  it("throws when version is not 1", () => {
    expect(() =>
      importState({ version: 2, contacts: [], plan: { meetingPlace: "", fallback: "" }, drillLog: [], theme: "system" })
    ).toThrow(/version/);
  });

  it("throws when contacts is not an array", () => {
    expect(() =>
      importState({ version: 1, contacts: "oops", plan: { meetingPlace: "", fallback: "" }, drillLog: [], theme: "system" })
    ).toThrow(/contacts/);
  });

  it("throws when contacts exceeds 10", () => {
    const contacts = Array.from({ length: 11 }, (_, i) => ({
      id: `id${i}`,
      name: `Person ${i}`,
      relation: "Friend",
      phone: "5550100100",
      mustMemorize: false,
      box: 1,
      nextDue: "2024-01-01",
    }));
    expect(() =>
      importState({ version: 1, contacts, plan: { meetingPlace: "", fallback: "" }, drillLog: [], theme: "system" })
    ).toThrow(/10/);
  });

  it("throws for a contact with an invalid phone string", () => {
    const contacts = [
      {
        id: "abc",
        name: "Bad Phone",
        relation: "Test",
        phone: "not-a-phone",
        mustMemorize: false,
        box: 1,
        nextDue: "2024-01-01",
      },
    ];
    expect(() =>
      importState({ version: 1, contacts, plan: { meetingPlace: "", fallback: "" }, drillLog: [], theme: "system" })
    ).toThrow(/phone/i);
  });

  it("throws for a contact with box outside 1–5", () => {
    const contacts = [
      {
        id: "abc",
        name: "Bad Box",
        relation: "Test",
        phone: "2125550101",
        mustMemorize: false,
        box: 6,
        nextDue: "2024-01-01",
      },
    ];
    expect(() =>
      importState({ version: 1, contacts, plan: { meetingPlace: "", fallback: "" }, drillLog: [], theme: "system" })
    ).toThrow(/box/i);
  });

  it("throws for a contact with malformed nextDue", () => {
    const contacts = [
      {
        id: "abc",
        name: "Bad Date",
        relation: "Test",
        phone: "2125550101",
        mustMemorize: false,
        box: 1,
        nextDue: "not-a-date",
      },
    ];
    expect(() =>
      importState({ version: 1, contacts, plan: { meetingPlace: "", fallback: "" }, drillLog: [], theme: "system" })
    ).toThrow(/nextDue/i);
  });

  it("throws when input is not an object", () => {
    expect(() => importState(null)).toThrow();
    expect(() => importState(42)).toThrow();
    expect(() => importState("string")).toThrow();
    expect(() => importState([])).toThrow();
  });

  it("throws when plan is missing", () => {
    expect(() =>
      importState({ version: 1, contacts: [], drillLog: [], theme: "system" })
    ).toThrow(/plan/);
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

const boxArb = (): fc.Arbitrary<Box> => fc.constantFrom<Box>(1, 2, 3, 4, 5);
const themeArb = (): fc.Arbitrary<"light" | "dark" | "system"> =>
  fc.constantFrom("light" as const, "dark" as const, "system" as const);
const isoDateArb = (): fc.Arbitrary<string> =>
  fc.date({ min: new Date("2020-01-01"), max: new Date("2029-12-31") }).map((d) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

/** Generates a valid 10-digit US phone string (digits only). */
const validPhoneArb = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.integer({ min: 2, max: 9 }),   // area code first digit
    fc.integer({ min: 0, max: 9 }),
    fc.integer({ min: 0, max: 9 }),
    fc.integer({ min: 2, max: 9 }),   // exchange first digit
    fc.integer({ min: 0, max: 9 }),
    fc.integer({ min: 0, max: 9 }),
    fc.integer({ min: 0, max: 9 }),
    fc.integer({ min: 0, max: 9 }),
    fc.integer({ min: 0, max: 9 }),
    fc.integer({ min: 0, max: 9 }),
  ).map((digits) => digits.join(""));

const contactArb = (): fc.Arbitrary<Contact> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim().length > 0),
    relation: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
    phone: validPhoneArb(),
    mustMemorize: fc.boolean(),
    box: boxArb(),
    nextDue: isoDateArb(),
  });

const householdPlanArb = (): fc.Arbitrary<{ meetingPlace: string; fallback: string }> =>
  fc.record({
    meetingPlace: fc.string({ maxLength: 200 }),
    fallback: fc.string({ maxLength: 200 }),
  });

const drillLogEntryArb = (): fc.Arbitrary<{ date: string; correct: number; incorrect: number }> =>
  fc.record({
    date: isoDateArb(),
    correct: fc.integer({ min: 0, max: 100 }),
    incorrect: fc.integer({ min: 0, max: 100 }),
  });

const appStateArb = (): fc.Arbitrary<AppState> =>
  fc.record({
    version: fc.constant(1 as const),
    contacts: fc.array(contactArb(), { maxLength: 10 }),
    plan: householdPlanArb(),
    drillLog: fc.array(drillLogEntryArb(), { maxLength: 20 }),
    theme: themeArb(),
  });

describe("P13 — loadState(saveState(s)) round-trips without data loss", () => {
  it("holds for arbitrary valid AppState", () => {
    fc.assert(
      fc.property(appStateArb(), (state) => {
        const { store } = makeStore();
        saveState(state, store);
        const loaded = loadState(store);
        expect(loaded).toEqual(state);
      })
    );
  });
});

describe("P14 — importState(JSON.parse(exportState(s))) equals s", () => {
  it("holds for arbitrary valid AppState", () => {
    fc.assert(
      fc.property(appStateArb(), (state) => {
        const exported = exportState(state);
        const imported = importState(JSON.parse(exported) as unknown);
        expect(imported).toEqual(state);
      })
    );
  });
});

describe("P15 — importState throws for missing version or invalid phone", () => {
  it("throws when version is missing", () => {
    fc.assert(
      fc.property(appStateArb(), (state) => {
        const obj = JSON.parse(exportState(state)) as Record<string, unknown>;
        delete obj["version"];
        expect(() => importState(obj)).toThrow();
      })
    );
  });

  it("throws when a contact has an invalid phone", () => {
    fc.assert(
      fc.property(
        appStateArb().filter((s) => s.contacts.length > 0),
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !/^\d{10}$/.test(s) && !/^\d{3}$/.test(s) && !/^1\d{10}$/.test(s)),
        (state, badPhone) => {
          const obj = JSON.parse(exportState(state)) as Record<string, unknown>;
          const contacts = obj["contacts"] as Record<string, unknown>[];
          contacts[0]!["phone"] = badPhone;
          expect(() => importState(obj)).toThrow();
        }
      )
    );
  });
});
