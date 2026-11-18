# Tasks: Dead Phone Directory

## T1 — Project scaffold
- [ ] Initialise `package.json` with scripts: `dev`, `build`, `preview`, `test`, `lint`.
- [ ] Add `vite`, `typescript`, `vitest`, `fast-check`, `eslint`, `typescript-eslint` as dev dependencies.
- [ ] Create `tsconfig.json` (strict mode, `moduleResolution: bundler`).
- [ ] Create `vite.config.ts` with `base: "/dead-phone-directory/"`.
- [ ] Create `vitest.config.ts` (environment: `node` for `src/lib/`, no jsdom).
- [ ] Create `eslint.config.ts` with typescript-eslint and `no-restricted-globals` rule banning `window`/`document`/`localStorage` inside `src/lib/`.
- [ ] Add `src/index.html` (Vite entry, semantic landmarks: `<header>`, `<nav>`, four `<section>` elements, `<footer>`).
- [ ] Add `public/manifest.json` (name, short name, display: standalone).
- [ ] Add `.github/workflows/deploy.yml` (build on push to `main`, deploy `dist/` to GitHub Pages).
- **Refs:** R8 (AC 31–32)

## T2 — `src/lib/phone.ts` + tests
- [ ] Implement `isServiceNumber`, `normalise`, `format`, `PhoneError`.
- [ ] Unit tests: valid 10-digit inputs in multiple formats, 11-digit with leading 1, service numbers, rejection cases.
- [ ] Property tests (fast-check): P1 round-trip idempotence, P2 no long digit runs in `format` output, P3 raw 10-digit passthrough, P4 `isServiceNumber` regex equivalence.
- **Refs:** R3 (AC 9–12)

## T3 — `src/lib/scheduler.ts` + tests
- [ ] Implement `intervalDays`, `recordCorrect`, `recordIncorrect`, `isDue`.
- [ ] Unit tests: each box transition, max-box cap, incorrect resets to box 1, `isDue` boundary dates.
- [ ] Property tests (fast-check): P5–P8.
- **Refs:** R6 (AC 23–26)

## T4 — `src/lib/streak.ts` + tests
- [ ] Implement `computeStreak`.
- [ ] Unit tests: empty log, single entry today, consecutive days, gap breaks streak, duplicates, longest vs current.
- [ ] Property tests (fast-check): P9–P12.
- **Refs:** R5 (AC 21–22)

## T5 — `src/lib/storage.ts` + tests
- [ ] Define `AppState`, `Contact`, `HouseholdPlan`, `DrillLogEntry` types.
- [ ] Implement `emptyState`, `demoState` (555-01xx numbers, ≥2 `mustMemorize` contacts).
- [ ] Implement `loadState` / `saveState` (key `dpd_v1`).
- [ ] Implement `importState` with JSON schema validation and version migration stub (v1→v1 no-op for now).
- [ ] Implement `exportState`.
- [ ] Define `EMERGENCY_CONTACTS` constant.
- [ ] Unit tests: round-trip, migration no-op, `importState` rejects bad phone, rejects missing version.
- [ ] Property tests (fast-check): P13–P15.
- **Refs:** R7 (AC 27–30), R2 (AC 6)

## T6 — Base styles and theming
- [ ] `src/styles/base.css`: CSS reset, custom properties for light palette (paper-white, ink-black, ruled-line grey, accent sepia), serif heading font stack (system serif).
- [ ] Add `[data-theme="dark"]` overrides and `@media (prefers-color-scheme: dark)` block.
- [ ] `src/styles/layout.css`: phone-first single-column grid, breakpoint at 640 px for two-column.
- [ ] `src/styles/directory.css`: ruled-line rows (`repeating-linear-gradient`), alphabet tab sidebar, spooky accent (subtle ghost-grey glow on headings, `prefers-reduced-motion` guard).
- [ ] `src/styles/drill.css`: drill card, input field, `aria-live` feedback region, reduced-motion guard.
- [ ] `src/ui/theme.ts`: read saved theme from storage, apply `data-theme`, wire toggle button, listen to `prefers-color-scheme` change.
- **Refs:** R9 (AC 33, 35–37)

## T7 — Contact list UI (`src/ui/contacts.ts`)
- [ ] Render contact rows (name, relation, formatted phone, memorize badge) using `phone.format`.
- [ ] Render emergency contacts section from `EMERGENCY_CONTACTS` (not editable).
- [ ] Add-contact form: fields for name, relation, phone, mustMemorize checkbox; inline validation using `phone.normalise`; disable form at 10 contacts.
- [ ] Edit contact: inline or modal form pre-filled from existing contact.
- [ ] Delete contact: confirmation step, then remove from state.
- [ ] All inputs have `<label>`, logical tab order; phone validation error shown in `role="alert"`.
- **Refs:** R1 (AC 1–5), R2 (AC 6), R3 (AC 9–12)

## T8 — Household plan UI (`src/ui/plan.ts`)
- [ ] Render meeting-place and fallback fields; save to storage on submit.
- [ ] Restore saved values on mount.
- [ ] Labels and focus order meet WCAG 2.2 AA.
- **Refs:** R2 (AC 7–8)

## T9 — Dead Phone Drill UI (`src/ui/drill.ts`)
- [ ] On session start, collect contacts where `mustMemorize && isDue(nextDue, today)`; show "nothing due" message if empty.
- [ ] Present one card at a time: show name and relation, ask for digits via `<input type="tel">`.
- [ ] On submit, compare normalised input against stored phone; call `recordCorrect` or `recordIncorrect`; update storage.
- [ ] Announce result in `aria-live="polite"` region; reveal correct number on incorrect.
- [ ] After all cards answered, append entry to `drillLog`, re-render streak.
- [ ] Entire flow operable by keyboard only (Enter to submit, focus managed between cards).
- **Refs:** R5 (AC 15–20), R6 (AC 23–26)

## T10 — Streak display
- [ ] After each completed drill session and on page load, call `computeStreak` with `drillLog` dates and today.
- [ ] Render current streak and longest streak in the drill section header.
- **Refs:** R5 (AC 21–22)

## T11 — Demo data and import/export (`src/ui/demo.ts`)
- [ ] "Load demo data" button: call `demoState()`, save to storage, re-render contacts and plan, show notice banner that data is fictional.
- [ ] "Export" button: call `exportState`, create a `Blob`, trigger download as `dead-phone-directory.json`.
- [ ] "Import" file input: read selected file, call `importState`, save to storage on success, re-render; show accessible error on failure.
- **Refs:** R7 (AC 27–30)

## T12 — Print layouts (`src/styles/print.css` + `src/ui/print.ts`)
- [ ] `print.css`: `@media print` hides all screen UI; `.print-wallet` uses `@page { size: 3.375in 2.125in; }` with two `.wallet-face` divs (front: flagged contacts, back: household plan); `.print-fridge` uses `@page { size: letter; }` with full contact list, emergencies, plan, and print-date footer.
- [ ] `src/ui/print.ts`: populate `.print-wallet` and `.print-fridge` from current storage state, then call `window.print()`.
- [ ] "Print wallet card" and "Print fridge sheet" buttons in the Print section, each keyboard-accessible.
- **Refs:** R4 (AC 13–14)

## T13 — Service worker and offline support
- [ ] Add `src/sw.ts` (Workbox-free, manual cache-first strategy): on `install`, cache all Vite-emitted assets; on `fetch`, serve from cache with network fallback.
- [ ] Register service worker in `main.ts` after page load.
- [ ] Verify zero network requests at runtime (no external fonts, no analytics).
- **Refs:** R8 (AC 31–32)

## T14 — Accessibility audit and final wiring
- [ ] Confirm all interactive elements have visible labels and correct tab order across all sections.
- [ ] Confirm `aria-live` regions are present and correctly scoped in drill and import feedback.
- [ ] Confirm `prefers-reduced-motion` suppresses all CSS transitions and animations.
- [ ] Wire `main.ts`: section navigation, initial state load, theme init, service worker registration.
- [ ] Run `npm run lint` and `npm run test` to green; fix any failures.
- **Refs:** R9 (AC 33–35)
