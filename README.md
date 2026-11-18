# Dead Phone Directory

A Kiroween 2026 Resurrection entry. It resurrects the paper home phone book so the numbers that matter are not trapped in a phone that is dead, lost, or stolen. Households build a short contact list, print a wallet card and fridge sheet, and run daily drills to actually memorize the numbers that count.

**Live app:** https://awinton64.github.io/dead-phone-directory/

## Features

- **Contact list**: up to 10 contacts with name, relation, phone number, and a "must memorize" flag. Built-in emergency numbers (911, 988, Poison Control) are always present and never stored.
- **Household plan**: designate a meeting place and a fallback contact.
- **Print layouts**: wallet card (3.375 × 2.125 in, front and back) and US Letter fridge sheet, both generated with print CSS only. No images, no server.
- **Dead Phone Drill**: daily spaced-repetition sessions (Leitner-box scheduler). Type each number from memory. After every answer a Next button appears; there is no auto-advance timer. Missed answers keep the correct number visible until you press Next.
- **Streak tracker**: current and longest daily drill streaks shown with candle icons.
- **Demo data**: load clearly synthetic 555-01xx contacts to explore the app.
- **Import / export**: save your directory as a JSON file and reload it on another device.
- **Offline-first PWA**: service worker caches all assets on first load; works with no network after that.
- **Dark mode**: follows the OS preference or use the "Theme" button to cycle System, Light, Candlelight.
- **Accessible**: WCAG 2.2 AA: labelled inputs, logical tab order, `aria-live` feedback, keyboard-only drill flow, reduced-motion guards.

## Privacy

**Nothing leaves your device.** All data is stored in `localStorage` only. No backend, no network calls, no analytics, no external fonts, no tracking of any kind. You can verify this: the entire codebase is in this repository and the network tab stays empty after the initial page load.

## How Kiro was used

Built with the **Kiro CLI** (headless `kiro-cli chat --v3 --no-interactive` runs, free tier). Everything Kiro used is in [`/.kiro`](.kiro):

- **Spec-driven, not vibe-coded.** Kiro wrote `requirements.md` (EARS acceptance criteria), `design.md` (data model, module interfaces, 15 correctness properties) and `tasks.md` (14 tasks) in `.kiro/specs/dead-phone-directory/`, then implemented the tasks in order, a few per run, ticking them off.
- **Steering** (`.kiro/steering/`): product, tech and structure rules loaded into every run (for example: `src/lib` stays pure and DOM-free, no network access anywhere).
- **Hooks** (`.kiro/hooks/`): tests on save in `src/lib`, lint on save, a `privacy-guard` agent hook that inspects every saved file for network access, and a `spec-sync` stop hook that keeps `tasks.md` checkboxes honest.
- **Property-based tests**: `fast-check` properties from `design.md` (phone normalisation round-trips, scheduler box invariants, streak edge cases, storage import/export round-trips), implemented by Kiro in `src/lib/*.test.ts`.

**Disclosure.** Kiro wrote the spec, steering, hooks and essentially all application code and tests. The entrant's other coding agent (Claude Code) wrote the run prompts, reviewed each result in a real browser, filed the bugs it found back to Kiro as new runs (stale service worker, phone-width layout, drill feedback), and made a few small direct edits: relative hook commands, a house style rule (no em dashes), one print heading, and this README section. The commit history labels every change.

## Local development

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173/dead-phone-directory/
npm test           # Vitest unit + property tests
npm run lint       # ESLint
npm run build      # Production build to dist/
npm run preview    # Preview the production build locally
```

Node 18+ required.

## Deployment

`npm run deploy` runs tests, lint and build, then publishes `dist/` to the `gh-pages` branch, which GitHub Pages serves at `/dead-phone-directory/`. (Kiro first wrote a GitHub Actions workflow for this; it was swapped for this script because the publishing token could not push workflow files.)

## License

MIT
