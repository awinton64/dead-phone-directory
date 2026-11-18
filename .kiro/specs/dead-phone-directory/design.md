# Design: Dead Phone Directory

## Architecture

The app is a single HTML page with no framework. `main.ts` boots the app, restores state from localStorage, and wires top-level navigation. All state mutations go through `src/lib/storage.ts`, which is the single point of contact with `localStorage`. UI modules in `src/ui/` read from and write to storage, then re-render their section.

```
index.html
  └── main.ts
        ├── lib/storage.ts   ← single localStorage gateway
        ├── lib/phone.ts
        ├── lib/scheduler.ts
        ├── lib/streak.ts
        └── ui/
              contacts.ts   → reads/writes storage, calls phone.ts
              drill.ts      → reads storage, calls scheduler.ts + streak.ts
              plan.ts       → reads/writes storage
              print.ts      → reads storage, triggers window.print()
              theme.ts      → reads/writes storage (theme pref)
              demo.ts       → writes storage
```

Data flows in one direction: user action → UI module → lib mutation → storage write → re-render. No shared mutable state outside storage.

---

## Data model

All persisted data lives under a single localStorage key `dpd_v1`.

```typescript
interface AppState {
  version: 1;
  contacts: Contact[];        // 0–10 user entries; emergencies not stored here
  plan: HouseholdPlan;
  drillLog: DrillLogEntry[];  // one entry per completed drill session
  theme: "light" | "dark" | "system";
}

interface Contact {
  id: string;                 // crypto.randomUUID()
  name: string;               // 1–60 chars
  relation: string;           // 1–40 chars
  phone: string;              // stored normalised: digits only, or "911"/"988" etc.
  mustMemorize: boolean;
  box: 1 | 2 | 3 | 4 | 5;    // Leitner box; default 1
  nextDue: string;            // ISO date YYYY-MM-DD; default today
}

interface HouseholdPlan {
  meetingPlace: string;       // 0–200 chars
  fallback: string;           // 0–200 chars
}

interface DrillLogEntry {
  date: string;               // ISO date YYYY-MM-DD (local)
  correct: number;
  incorrect: number;
}
```

Emergency numbers are **not** stored in `AppState`. They are defined as a compile-time constant in `src/lib/storage.ts` and merged into the rendered contact list at display time.

```typescript
const EMERGENCY_CONTACTS = [
  { name: "Emergency",                    phone: "911" },
  { name: "Suicide & Crisis Lifeline",    phone: "988" },
  { name: "Poison Control",               phone: "18002221222" },
] as const;
```

---

## Module interfaces

### `src/lib/phone.ts`

```typescript
/** Returns true for N11 codes (/^[2-9]11$/) and for "988". */
export function isServiceNumber(raw: string): boolean;

/** Strips formatting characters and returns digits only, or throws PhoneError. */
export function normalise(raw: string): string;

/**
 * Formats a normalised phone string for display.
 *   10-digit  → "(NXX) NXX-XXXX"
 *   3-digit   → "911", "988", etc.
 *   11-digit starting with 1 → "1 (NXX) NXX-XXXX"
 */
export function format(normalised: string): string;

export class PhoneError extends Error {}
```

### `src/lib/scheduler.ts`

```typescript
export type Box = 1 | 2 | 3 | 4 | 5;

/** Interval in days for each box: box N → 2^(N-1) days. */
export function intervalDays(box: Box): number;

/**
 * Returns the next-due ISO date after a correct answer.
 * box advances by 1 (capped at 5); due = today + intervalDays(newBox).
 */
export function recordCorrect(
  today: string,   // YYYY-MM-DD
  box: Box
): { box: Box; nextDue: string };

/**
 * Returns the next-due ISO date after an incorrect answer.
 * box resets to 1; due = today.
 */
export function recordIncorrect(
  today: string
): { box: Box; nextDue: string };

/** Returns true if nextDue <= today (both YYYY-MM-DD). */
export function isDue(nextDue: string, today: string): boolean;
```

### `src/lib/streak.ts`

```typescript
/**
 * Given a sorted array of ISO date strings (drill log dates, may have duplicates),
 * returns { current, longest }.
 * "Current" streak: how many consecutive calendar days ending on today (or yesterday)
 * have an entry. "Longest": historical maximum.
 */
export function computeStreak(
  dates: string[],
  today: string   // YYYY-MM-DD
): { current: number; longest: number };
```

### `src/lib/storage.ts`

```typescript
export function loadState(): AppState;
export function saveState(state: AppState): void;

/** Parses unknown JSON, validates schema, migrates older versions, returns AppState. */
export function importState(json: unknown): AppState;

/** Serialises AppState to a JSON string suitable for file download. */
export function exportState(state: AppState): string;

/** Returns a fresh AppState with zero contacts and empty plan. */
export function emptyState(): AppState;

/** Returns an AppState pre-populated with synthetic demo contacts. */
export function demoState(): AppState;
```

---

## Drill session rules

- **Answer comparison**: both the user's typed input and the stored phone are passed through `normalise()` before comparison. A match on digits is correct regardless of how the user formatted the entry.
- **Session cap**: a drill session shows at most 5 cards. When more than 5 contacts are due, the session takes the 5 with the earliest `nextDue` (ties broken by `id` lexicographic order).

## UI sections

| Section | Element id | Visible when |
|---|---|---|
| Directory | `#section-directory` | default / nav "Directory" |
| Drill | `#section-drill` | nav "Drill" |
| Plan | `#section-plan` | nav "Plan" |
| Print preview | `#section-print` | nav "Print" |

Navigation toggles `hidden` on the inactive sections. No URL changes.

---

## Print layout

Two `@page` rules in `print.css`:

- **`.print-wallet`**: `@page { size: 3.375in 2.125in; margin: 0.1in; }`. Front: flagged contacts. Back: household plan. Rendered as two adjacent `<div class="wallet-face">` blocks that become separate pages.
- **`.print-fridge`**: `@page { size: letter; margin: 0.5in; }`. All contacts, emergency numbers, household plan, and a footer with the print date.

Both classes are set to `display: none` in screen CSS and `display: block` in `@media print`.

---

## Correctness properties for property-based tests

### `phone.ts`
- **P1** `normalise(format(normalise(x))) === normalise(x)` for any valid input (idempotence of round-trip).
- **P2** `format` output never contains raw digit runs longer than 4 characters (always grouped).
- **P3** For any string of 10 ASCII digits `d`, `normalise(d) === d`.
- **P4** `isServiceNumber` returns true iff the string matches `/^[2-9]11$/` or equals `"988"` exactly.

### `scheduler.ts`
- **P5** `intervalDays(box)` equals `2 ** (box - 1)` for all boxes 1–5.
- **P6** After `recordCorrect`, `newBox === Math.min(box + 1, 5)`.
- **P7** After any sequence of correct/incorrect answers, `box` is always in `{1,2,3,4,5}`.
- **P8** `isDue(nextDue, today)` is equivalent to `nextDue <= today` (lexicographic, valid for ISO dates).

### `streak.ts`
- **P9** `computeStreak([], today).current === 0`.
- **P10** For any date list containing only `today`, `current === 1`.
- **P11** `longest >= current` always.
- **P12** Duplicate dates in the input do not increase the streak count beyond what the deduplicated list would produce.

### `storage.ts`
- **P13** `loadState(saveState(s))` round-trips without data loss for any valid `AppState`.
- **P14** `importState(JSON.parse(exportState(s)))` equals `s` for any valid `AppState`.
- **P15** `importState` throws for any input where `version` is missing or contacts contain an invalid phone string.
