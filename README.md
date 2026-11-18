# Dead Phone Directory

A Kiroween 2026 Resurrection entry. It resurrects the paper home phone book so the numbers that matter are not trapped in a phone that is dead, lost, or stolen. Households build a short contact list, print a wallet card and fridge sheet, and run daily drills to actually memorize the numbers that count.

## Features

- **Contact list** — up to 10 contacts with name, relation, phone number, and a "must memorize" flag. Built-in emergency numbers (911, 988, Poison Control) are always present and never stored.
- **Household plan** — designate a meeting place and a fallback contact.
- **Print layouts** — wallet card (3.375 × 2.125 in, front and back) and US Letter fridge sheet, both generated with print CSS only. No images, no server.
- **Dead Phone Drill** — daily spaced-repetition sessions (Leitner-box scheduler). Type each number from memory. After every answer a Next button appears; there is no auto-advance timer. Missed answers keep the correct number visible until you press Next.
- **Streak tracker** — current and longest daily drill streaks shown with candle icons.
- **Demo data** — load clearly synthetic 555-01xx contacts to explore the app.
- **Import / export** — save your directory as a JSON file and reload it on another device.
- **Offline-first PWA** — service worker caches all assets on first load; works with no network after that.
- **Dark mode** — follows the OS preference or use the "Theme" button to cycle System → Light → Candlelight.
- **Accessible** — WCAG 2.2 AA: labelled inputs, logical tab order, `aria-live` feedback, keyboard-only drill flow, reduced-motion guards.

## Privacy

**Nothing leaves your device.** All data is stored in `localStorage` only. No backend, no network calls, no analytics, no external fonts, no tracking of any kind. You can verify this: the entire codebase is in this repository and the network tab stays empty after the initial page load.

## How Kiro was used

This project was built with [Kiro](/.kiro), Jetbrains' agentic IDE. The `.kiro/` directory contains everything Kiro used:

- **Steering** (`.kiro/steering/`) — product brief, tech stack rules, and project structure rules applied to every agent session.
- **Spec** (`.kiro/specs/dead-phone-directory/`) — `requirements.md`, `design.md`, and `tasks.md` written collaboratively, then executed task by task.
- **Hooks** (`.kiro/hooks/`) — a post-file-save hook that checked every saved file for outbound network access, enforcing the privacy promise automatically.
- **Property-based tests** — `fast-check` properties in `src/lib/*.test.ts` were specified in `design.md` and implemented by Kiro, covering phone normalisation round-trips, scheduler invariants, streak edge cases, and storage migration.

## Local development

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173/dead-phone-directory/
npm test           # Vitest unit + property tests
npm run lint       # ESLint
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally
```

Node 18+ required.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds and deploys `dist/` to GitHub Pages at `/dead-phone-directory/`.

## License

MIT
