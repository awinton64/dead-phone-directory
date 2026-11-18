# Product: Dead Phone Directory

## Purpose

A Kiroween 2026 Resurrection entry. It resurrects the paper home phone book so the numbers that matter are not trapped in a phone that is dead, lost, or stolen. Households build a short contact list, print a wallet card and fridge sheet, and run daily drills to actually memorize the numbers that count.

## Target users

Families and households who want an offline-first safety net for phone outages, theft, or emergencies — especially useful for children and older adults who cannot rely on a contacts app.

## Core features

### Contact list
- 5–10 key contacts per household: name, relation, phone number, and a "must memorize" flag.
- Household plan: designated meeting place and a fallback contact (neighbor, landline, etc.).
- Built-in emergency numbers always present: 911, 988 (Suicide and Crisis Lifeline), Poison Control 1-800-222-1222.

### Print layouts
- **Wallet card**: fits 3.375 × 2.125 in, front and back, using print CSS only. No images, no server.
- **Fridge sheet**: US Letter, all contacts plus household plan, also print CSS only.

### Dead Phone Drill
- Daily short session: the user types digits to recall numbers flagged "must memorize."
- Spaced-repetition scheduler (Leitner-box or SM-2-lite), deterministic and date-based in local days.
- Daily streak tracked in localStorage.

### Data management
- Demo data loader: clearly synthetic contacts using 555-01xx numbers only.
- Import / export as JSON.
- All data stored in localStorage only. No backend, no network calls, no analytics.

## Constraints

- Static site only. Must work fully offline after initial load.
- Accessible: WCAG 2.2 AA (labels, focus order, keyboard-only drill, aria-live feedback, reduced motion).
- Phone-first responsive layout.
- Dark mode: `prefers-color-scheme` media query plus a manual toggle.
- Visual style: old paper phone directory — ruled lines, alphabet index tabs, serif headings — with a light spooky resurrection aesthetic that does not hurt legibility.
- Deployed to GitHub Pages at base path `/dead-phone-directory/`.
