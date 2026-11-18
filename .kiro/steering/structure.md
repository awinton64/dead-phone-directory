# Project Structure

```
dead-phone-directory/
├── .kiro/
│   ├── steering/
│   │   ├── product.md
│   │   ├── tech.md
│   │   └── structure.md
│   └── specs/
│       └── dead-phone-directory/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── public/
│   ├── manifest.json          # Web app manifest (offline-capable PWA shell)
│   └── sw.js                  # Service worker (plain JS, copied verbatim by Vite)
├── src/
│   ├── lib/                   # Pure logic: no DOM, no browser globals
│   │   ├── phone.ts           # US number normalisation and formatting
│   │   ├── phone.test.ts
│   │   ├── scheduler.ts       # Leitner-box spaced-repetition
│   │   ├── scheduler.test.ts
│   │   ├── streak.ts          # Daily streak from ISO date log
│   │   ├── streak.test.ts
│   │   ├── storage.ts         # Schema types, versioned migration, import/export
│   │   └── storage.test.ts
│   ├── ui/                    # DOM-dependent modules
│   │   ├── contacts.ts        # Contact list view (render, add, edit, delete)
│   │   ├── drill.ts           # Dead Phone Drill session controller
│   │   ├── plan.ts            # Household plan view
│   │   ├── print.ts           # Triggers print dialog, injects print-only markup
│   │   ├── theme.ts           # Dark-mode toggle and prefers-color-scheme watcher
│   │   └── demo.ts            # Demo data loader
│   ├── styles/
│   │   ├── base.css           # Reset, CSS custom properties, typography
│   │   ├── layout.css         # Phone-first responsive grid
│   │   ├── directory.css      # Paper directory visual style (ruled lines, tabs)
│   │   ├── drill.css          # Drill session styles, aria-live regions
│   │   └── print.css          # @media print: wallet card and fridge sheet
│   └── main.ts                # App entry point: boot, router, top-level event wiring
├── index.html                 # Vite entry: at repo root (Vite default)
├── eslint.config.js           # Flat ESLint config (plain JS, no extra loader needed)
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── package.json
└── scripts/
    └── deploy.sh              # Build and publish dist/ to the gh-pages branch
```

## Key conventions

- **`src/lib/` boundary**: nothing in `src/lib/` may import from `src/ui/`, `src/styles/`, or any browser-only API (`document`, `window`, `localStorage`, etc.). Violations are caught by ESLint `no-restricted-globals` and by running lib tests in a pure Node environment.
- **Single HTML file**: the app is a single page. Navigation between sections (directory, drill, plan, print preview) is handled by showing/hiding `<section>` elements, not by URL routing.
- **CSS custom properties** drive theming. Light and dark palettes are declared on `:root` and overridden under `[data-theme="dark"]` as well as `@media (prefers-color-scheme: dark)`.
- **Print CSS**: wallet card and fridge sheet layouts live entirely in `src/styles/print.css` using `@media print` and `@page` rules. No JavaScript is involved in rendering the printed output.
- **No build-time code generation**: demo data is a plain TypeScript constant, not generated from a script.
- **Test files** sit next to their source (`*.test.ts`) inside `src/lib/`. UI modules are not unit-tested (manual + accessibility testing instead).
- **Service worker**: `public/sw.js` is plain JavaScript (not TypeScript). Vite copies it verbatim to `dist/`. Registered from `main.ts` with a relative URL (`./sw.js`) so it resolves correctly under the `/dead-phone-directory/` base path.
