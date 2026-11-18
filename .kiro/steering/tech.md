# Tech Stack

## Language and build

- **TypeScript** (strict mode) throughout.
- **Vite** (vanilla, no framework) for dev server, bundling, and GitHub Pages deployment.
  - `base` in `vite.config.ts`: `/dead-phone-directory/`
  - Output: `dist/`
- **No runtime framework** (React, Vue, Svelte, etc.). Vanilla DOM only.

## Testing

- **Vitest** for unit and property-based tests.
- **fast-check** for property-based tests on pure logic modules.
- Tests live alongside source files (`*.test.ts`) or in `src/__tests__/`.
- Coverage threshold: 80% lines on pure logic modules.

## Linting

- **ESLint** with flat config (`eslint.config.js`).
- **typescript-eslint** for TypeScript rules.
- No Prettier (formatting is not enforced by CI, but code should be consistent).
- `eslint.config.js` uses plain JavaScript (not `.ts`) to avoid requiring a loader.

## Module architecture rule

Pure logic modules **must not import** any DOM API or browser global. This boundary is enforced by keeping them in `src/lib/` and importing them freely in `src/ui/`. Tests for `src/lib/` run in a Node environment (no jsdom needed).

## Pure logic modules (`src/lib/`)

| Module | Responsibility |
|---|---|
| `phone.ts` | Normalise and format US numbers, including 3-digit service numbers (911, 988, 211, etc.) |
| `scheduler.ts` | Leitner-box spaced-repetition: box assignment, next-due date, answer recording |
| `streak.ts` | Daily streak calculation from an array of ISO date strings |
| `storage.ts` | localStorage schema definition, versioned migration, import/export serialisation |

## Dependencies (keep minimal)

| Package | Role |
|---|---|
| `vite` | Build / dev |
| `typescript` | Type checking |
| `vitest` | Test runner |
| `fast-check` | Property-based testing |
| `eslint` | Linting |
| `typescript-eslint` | TS lint rules |

No UI component libraries. No date libraries (use `Intl` and simple arithmetic on ISO date strings). No CSS frameworks.

## Deployment

- `npm run build` → `dist/`
- GitHub Actions deploys `dist/` to GitHub Pages on push to `main`.
- Base path: `/dead-phone-directory/`
