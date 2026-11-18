# Kiro usage log: Dead Phone Directory (Kiroween 2026)

Every Kiro CLI invocation for the entry repo ~/code/dead-phone-directory. Kiro CLI 3.4.0, Builder ID free tier (KIRO FREE, 50 credits per month). Credits read from the Kiro getUsageLimits API with the CLI's own session (currentUsageWithPrecision of usageLimit). Runs are headless: `kiro-cli chat --v3 --no-interactive --trust-workspace --trust-tools=<list>`. Each run's full transcript is in runs/.

Pre-build usage on this account: 0.45 credits (feasibility gate, scratch repo) plus 0.13 credits (an accidental "/usage" prompt sent to the headless agent in the scratch repo while looking for the user ID). Starting balance for the build: 0.58 of 50 used.

## 01-steering-and-spec
- Start 2026-11-18T11:08:46Z, end 2026-11-18T11:10:35Z (109s), exit 0, model auto, trust-tools `read,write`
- Credits before: 0.58 of 50.0; after: 1.86 of 50.0
- Prompt:

    You are starting a new project in this empty repo (only LICENSE and .gitignore exist). Do NOT write any application code yet. Only write these Kiro files:
    
    1. Steering in .kiro/steering/: product.md, tech.md, structure.md.
    2. A spec in .kiro/specs/dead-phone-directory/: requirements.md (user stories with numbered EARS-style acceptance criteria), design.md (architecture, data model, module interfaces, correctness properties for property-based tests), tasks.md (an ordered, checkbox implementation plan, each task referencing requirement numbers, small enough to implement one at a time, tests alongside code).
    
    Product: "Dead Phone Directory", a Kiroween 2026 Resurrection entry. It resurrects the paper home phone book so the numbers that matter are not trapped in a phone that is dead, lost or stolen. Features:
    - A household enters 5 to 10 key contacts (name, relation, phone number, "must memorize" flag) and a household plan (meeting place, fallback such as a neighbor or landline).
    - Print a wallet card (fits 3.375in x 2.125in, front/back) and a fridge sheet (US Letter), using print CSS only.
    - A daily "dead phone drill": short session that asks the user to recall flagged numbers (type the digits), with a spaced-repetition scheduler (Leitner boxes or SM-2-lite, deterministic, date-based in local days), and a daily streak.
    - Built-in emergency numbers: 911, 988 (Suicide and Crisis Lifeline), Poison Control 1-800-222-1222.
    - Demo data loader with clearly synthetic contacts (555-01xx numbers only). Import/export JSON.
    - Static site only: no backend, no network calls, no analytics; data in localStorage only. Must work offline after load.
    - Accessible (WCAG 2.2 AA: labels, focus order, keyboard-only drill, aria-live feedback, reduced motion), phone-first responsive layout, dark mode via prefers-color-scheme plus a toggle. Visual style: old paper phone directory (ruled lines, alphabet index tabs, serif headings), a light spooky resurrection touch without hurting legibility.
    
    Tech: TypeScript, Vite (vanilla, no framework), Vitest, fast-check for property-based tests, ESLint (flat config) with typescript-eslint. Deployed to GitHub Pages under the base path /dead-phone-directory/. Keep dependencies minimal. Pure logic modules (phone normalisation and formatting for US numbers including 3-digit service numbers, scheduler, streak, storage schema validation and migration) must be separated from DOM code and fully unit and property tested.
    
    Keep each file focused and concise (requirements under about 200 lines, design under about 250, tasks about 12 to 18 top-level tasks).

- Files changed (git status vs last commit):

    ?? .kiro/

- Transcript: runs/01-steering-and-spec.log

## 02-spec-fixes-and-hooks
- Start 2026-11-18T11:10:59Z, end 2026-11-18T11:12:33Z (94s), exit 0, model auto, trust-tools `read,write`
- Credits before: 1.86 of 50.0; after: 3.82 of 50.0
- Prompt:

    Read .kiro/steering/*.md and .kiro/specs/dead-phone-directory/*.md. Do NOT write application code. Make two kinds of changes only:
    
    A. Spec fixes from review (edit the spec files in place, keep them concise):
    1. design.md P4 says isServiceNumber is true iff /^[2-9]11$/, but 988 is also a service number. Change the rule and P4 to: true iff the input is an N11 code (/^[2-9]11$/) or exactly "988".
    2. T13: replace the TypeScript service worker with a plain public/sw.js (cache-first for same-origin GET requests, versioned cache name, cleans old caches on activate), registered from main.ts with a relative URL so it works under the /dead-phone-directory/ base path. Vite must not need a plugin for it.
    3. T1: use eslint.config.js (not .ts) so no extra loader is needed, and keep index.html at the repo root (Vite default root).
    4. Add to the drill requirement and design: answers are compared after normalise() so "555-0123" and "5550123" style formatting differences never count as wrong; and a drill session shows at most 5 cards.
    
    B. Agent hooks in .kiro/hooks/ (use your hook tool or the correct Kiro hook file format), short and practical:
    1. "lib-tests-on-save": when a file under src/lib/ is saved, run `npm test -- --run`.
    2. "lint-on-save": when any .ts file under src/ is saved, run `npm run lint`.
    3. "privacy-guard": when a file under src/ or public/ is saved, have the agent check the saved file for any network access (fetch, XMLHttpRequest, WebSocket, sendBeacon, external http(s) URLs in src/link/script tags, analytics) and report or remove it, because the product promise is that nothing leaves the device.
    4. "spec-sync": when a task is completed (agent stop), ask the agent to tick the matching checkboxes in .kiro/specs/dead-phone-directory/tasks.md.

- Files changed (git status vs last commit):

     M .kiro/specs/dead-phone-directory/design.md
     M .kiro/specs/dead-phone-directory/requirements.md
     M .kiro/specs/dead-phone-directory/tasks.md
     M .kiro/steering/structure.md
     M .kiro/steering/tech.md
    ?? .kiro/hooks/

- Transcript: runs/02-spec-fixes-and-hooks.log

## 03-impl-T1-T3
- Start 2026-11-18T11:12:49Z, end 2026-11-18T11:14:46Z (117s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 3.82 of 50.0; after: 6.19 of 50.0
- Prompt:

    Implement tasks T1, T2 and T3 from .kiro/specs/dead-phone-directory/tasks.md, following .kiro/steering and design.md exactly. Do not start T4 or later.
    
    - T1 scaffold: package.json (type module, scripts dev/build/preview/test/lint; "test" runs vitest), tsconfig.json, vite.config.ts, vitest config, eslint.config.js, a minimal root index.html with the semantic landmarks, public/manifest.json, .github/workflows/deploy.yml (GitHub Pages via actions/upload-pages-artifact and actions/deploy-pages). Install only: vite, typescript, vitest, fast-check, eslint, typescript-eslint, @eslint/js (use `npm install --save-dev --no-audit --no-fund`).
    - T2 src/lib/phone.ts with unit tests and fast-check property tests P1 to P4.
    - T3 src/lib/scheduler.ts with unit tests and property tests P5 to P8. Dates are local-day ISO strings (YYYY-MM-DD); do date arithmetic without timezone bugs (use UTC-based day math on the parsed Y-M-D).
    
    Then run `npm test -- --run` and `npm run lint` and fix failures until both pass. Tick the T1 to T3 checkboxes in tasks.md when done. Do not git commit. Be economical: no long explanations.

- Files changed (git status vs last commit):

     M .kiro/specs/dead-phone-directory/tasks.md
    ?? .github/
    ?? eslint.config.js
    ?? index.html
    ?? package-lock.json
    ?? package.json
    ?? public/
    ?? src/
    ?? tsconfig.json
    ?? vite.config.ts
    ?? vitest.config.ts

- Transcript: runs/03-impl-T1-T3.log

## 04-impl-T4-T5
- Start 2026-11-18T11:15:03Z, end 2026-11-18T11:17:09Z (126s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 6.19 of 50.0; after: 9.05 of 50.0
- Prompt:

    Implement tasks T4 and T5 from .kiro/specs/dead-phone-directory/tasks.md, following .kiro/steering and design.md. T1 to T3 are done (src/lib/phone.ts, src/lib/scheduler.ts). Do not start T6 or later.
    
    - T4 src/lib/streak.ts with unit tests and fast-check properties P9 to P12. Current streak counts consecutive days ending today, or ending yesterday if today has no entry yet.
    - T5 src/lib/storage.ts with unit tests and properties P13 to P15. Keep it testable in Node: loadState/saveState take an optional Storage-like argument ({getItem,setItem}) that defaults to globalThis.localStorage, so src/lib never references window or document. loadState returns emptyState() on missing or corrupt data instead of throwing. Validate every imported field (types, lengths, max 10 contacts, phone via phone.normalise, box 1 to 5, ISO dates). demoState contacts must be obviously fictional (e.g. "Aunt Mavis (demo)"), use only 555-0100 to 555-0199 numbers with a real-looking area code, and at least 3 must be mustMemorize. Use an id generator that falls back when crypto.randomUUID is missing.
    
    Then run `npm test -- --run` and `npm run lint` and fix failures until both pass. Tick T4 and T5 in tasks.md. Do not git commit. Be economical: no long explanations.

- Files changed (git status vs last commit):

     M .kiro/specs/dead-phone-directory/tasks.md
    ?? src/lib/storage.test.ts
    ?? src/lib/storage.ts
    ?? src/lib/streak.test.ts
    ?? src/lib/streak.ts

- Transcript: runs/04-impl-T4-T5.log

## 05-impl-T6-T8
- Start 2026-11-18T11:17:25Z, end 2026-11-18T11:25:45Z (500s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 9.05 of 50.0; after: 14.21 of 50.0
- Prompt:

    Implement tasks T6, T7 and T8 from .kiro/specs/dead-phone-directory/tasks.md, following .kiro/steering and design.md. src/lib (phone, scheduler, streak, storage) is done and tested; reuse it, do not change its behaviour. Do not start T9 or later.
    
    - T6 styles and src/ui/theme.ts. Paper phone-directory look: warm paper background with faint ruled lines, ink text, serif headings (system serif stack, no web fonts), alphabet index tabs, one restrained "resurrection" accent (a candle-flame amber). Dark mode = the same directory read by candlelight (deep sepia-black paper, warm off-white ink). Contrast must meet WCAG AA in both themes. Theme toggle cycles system/light/dark and persists via storage. Visible focus rings. prefers-reduced-motion respected.
    - T7 src/ui/contacts.ts: directory list grouped alphabetically with the index tabs, emergency numbers block, add/edit/delete with inline validation and role="alert" errors, max 10 contacts, phone input type="tel" with autocomplete="off".
    - T8 src/ui/plan.ts.
    - Create src/main.ts with enough wiring to run: load state, init theme, render directory and plan, section navigation with buttons (aria-current), and a "Load demo data" button that replaces state with demoState() after confirm(). Link main.ts and the CSS from index.html. Phone-first layout: tap targets at least 44px, no horizontal scroll at 360px width.
    - Escape all user text (use textContent or DOM APIs, never innerHTML with user data).
    
    Then run `npm test -- --run`, `npm run lint` and `npm run build` and fix failures until all pass. Tick T6 to T8 in tasks.md. Do not git commit. Be economical: no long explanations.

- Files changed (git status vs last commit):

     M .kiro/specs/dead-phone-directory/tasks.md
     M index.html
     M src/main.ts
     M tsconfig.json
    ?? src/styles/
    ?? src/ui/

- Transcript: runs/05-impl-T6-T8.log

## 06-impl-T9-T11
- Start 2026-11-18T11:26:25Z, end 2026-11-18T11:28:08Z (103s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 14.21 of 50.0; after: 16.94 of 50.0
- Prompt:

    Implement tasks T9, T10 and T11 from .kiro/specs/dead-phone-directory/tasks.md, following .kiro/steering and design.md. T1 to T8 are done; reuse src/lib and the existing UI modules and styles. Do not start T12 or later.
    
    - T9 src/ui/drill.ts, the "dead phone drill": start screen explains the idea in one sentence ("Your phone just died. Who can you still call?") and shows how many numbers are due. One card at a time (max 5 per session): show name and relation, a large type="tel" input with inputmode="numeric" and autocomplete="off", Enter submits. Compare after normalise(); invalid or wrong input counts as a miss and reveals the right number; correct shows a short success line. Feedback in an aria-live="polite" region, focus moves to the input of the next card, then to a summary with correct/missed counts. Update box/nextDue via scheduler and append a DrillLogEntry. If no contacts are flagged, explain how to flag them. If nothing is due today, say when the next one is due and offer "Practice anyway" (practice runs do not change boxes but still count for the streak).
    - T10 streak: show current and longest streak in the drill header, with a small candle icon per streak day up to 7 (text alternative provided).
    - T11 src/ui/demo.ts: move the existing demo button logic here; add Export (download dead-phone-directory.json via Blob and object URL) and Import (file input, importState, accessible error on failure, confirm before replacing).
    - Visual bug fix: in the directory list, the ruled-line background currently runs through the middle of the relation text, so it looks struck through. Align the rules to sit under each line of text (or under each row only).
    
    Then run `npm test -- --run`, `npm run lint` and `npm run build` and fix failures until all pass. Tick T9 to T11 in tasks.md. Do not git commit. Be economical: no long explanations.

- Files changed (git status vs last commit):

     M .kiro/specs/dead-phone-directory/tasks.md
     M index.html
     M src/main.ts
     M src/styles/directory.css
     M src/styles/drill.css
    ?? src/ui/demo.ts
    ?? src/ui/drill.ts

- Transcript: runs/06-impl-T9-T11.log

## 07-impl-T12-T14
- Start 2026-11-18T11:28:57Z, end 2026-11-18T11:36:28Z (451s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 16.94 of 50.0; after: 21.13 of 50.0
- Prompt:

    Implement tasks T12, T13 and T14 from .kiro/specs/dead-phone-directory/tasks.md, following .kiro/steering and design.md. T1 to T11 are done; reuse the existing modules.
    
    - T12 print: src/ui/print.ts and src/styles/print.css. Print section shows an on-screen preview of the wallet card (front: up to 5 must-memorize contacts plus 911, back: meeting place, fallback, 988 and Poison Control) and the fridge sheet (title "Our Dead Phone Directory", all contacts grouped A to Z, emergency numbers, household plan, a "practice these by heart" list, printed date). "Print wallet card" and "Print fridge sheet" buttons set a class on <body> to choose which layout prints, then window.print(), then clear it on afterprint. Wallet card prints at true size 3.375in x 2.125in with cut lines on a Letter page (do not rely on @page size for the card, browsers ignore it). Text must never overflow the card: truncate long names with an ellipsis and use a fixed small font. Print is always black ink on white regardless of theme.
    - T13 offline: public/sw.js as in the spec, registered from main.ts only in production builds (import.meta.env.PROD).
    - T14 accessibility and wiring pass, plus these review fixes:
      1. Drill: after a miss, the correct number must stay visible with the feedback until the user presses a "Next" button (which receives focus); after a correct answer, also show a "Next" button. Do not auto-advance on a timer.
      2. The theme toggle currently shows a gear icon. Make it a text button that names the current mode ("Theme: System", "Theme: Light", "Theme: Candlelight") with aria-live off.
      3. Add a short README.md: what it is (the resurrection pitch in two sentences), features, privacy (nothing leaves the device), how Kiro was used (spec, steering, hooks, property tests; point to /.kiro), local dev commands, MIT license.
    
    Then run `npm test -- --run`, `npm run lint` and `npm run build` and fix failures until all pass. Tick T12 to T14 in tasks.md. Do not git commit. Be economical: no long explanations.

- Files changed (git status vs last commit):

     M index.html
     M src/main.ts
     M src/styles/print.css
     M src/ui/drill.ts
     M src/ui/theme.ts
    ?? README.md
    ?? public/sw.js
    ?? src/ui/print.ts

- Transcript: runs/07-impl-T12-T14.log

## 08-finish-T12-T14
- Start 2026-11-18T11:36:45Z, end 2026-11-18T11:37:32Z (47s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 21.13 of 50.0; after: 22.02 of 50.0
- Prompt:

    Your previous session implementing T12 to T14 of .kiro/specs/dead-phone-directory/tasks.md stopped before the final checks. Finish it:
    1. `npm run build` fails with: src/main.ts(118,19): error TS2339: Property 'env' does not exist on type 'ImportMeta'. Fix it properly (Vite client types), not with a cast.
    2. Re-read src/ui/print.ts once for leftover broken code from the incremental edits and confirm the wallet card front and back are both rendered.
    3. Run `npm test -- --run`, `npm run lint`, `npm run build`; fix until all pass.
    4. Tick T12 to T14 in tasks.md only for items that are actually done.
    Do not git commit. Be economical.

- Files changed (git status vs last commit):

     M .kiro/specs/dead-phone-directory/tasks.md
     M index.html
     M src/main.ts
     M src/styles/print.css
     M src/ui/drill.ts
     M src/ui/theme.ts
     M tsconfig.json
    ?? README.md
    ?? public/sw.js
    ?? src/ui/print.ts

- Transcript: runs/08-finish-T12-T14.log

## 09-fix-sw-stale
- Start 2026-11-18T11:39:25Z, end 2026-11-18T11:39:55Z (30s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 22.02 of 50.0; after: 22.02 of 50.0
- Prompt:

    Bug found in review (browser test): public/sw.js is cache-first for everything, including index.html, so after a new deploy users keep getting the old index.html and the old hashed JS forever.
    
    Fix public/sw.js only:
    - Navigation requests (request.mode === "navigate") and index.html: network-first, fall back to the cached copy when offline, and update the cache on success.
    - Files under assets/ (Vite content-hashed): cache-first is fine.
    - Everything else same-origin GET: stale-while-revalidate.
    - Bump CACHE_NAME to "dpd-v2" so the old cache is deleted on activate.
    Keep it plain JavaScript with short comments, no em dashes. Update the T13 wording in tasks.md to match. Do not touch other files. Run `npm run build` to confirm. Do not git commit. Be brief.

- Files changed (git status vs last commit):

     M .kiro/specs/dead-phone-directory/tasks.md
     M public/sw.js
     M src/ui/print.ts

- Transcript: runs/09-fix-sw-stale.log

## 10-fix-phone-layout
- Start 2026-11-18T11:40:29Z, end 2026-11-18T11:41:19Z (50s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 22.52 of 50.0; after: 22.52 of 50.0
- Prompt:

    Two layout bugs found in a 360px-wide phone screenshot. Fix with CSS (and minimal markup changes if needed) in src/styles/ and index.html only:
    1. Header: the "Theme: ..." text button overflows off the right edge at 360px. Let the header wrap or shrink: title and button must both fit with no horizontal scroll at 320px and up (the title may shrink, the button may move below the title on narrow screens).
    2. Directory rows: a long name ("Neighbor Dolores (demo)") overlaps the phone number. Name/relation and number must never overlap: allow the name to wrap, or stack the number under the name below about 400px. The number must never wrap mid-number (white-space: nowrap).
    Also move the "+ Add Contact" button so it sits directly under the toolbar (above the A-Z list) rather than below the emergency numbers.
    Keep the paper-directory style. No em dashes. Run `npm run lint` and `npm run build`. Do not git commit. Be brief.

- Files changed (git status vs last commit):

     M index.html
     M src/styles/directory.css
     M src/styles/layout.css
     M src/ui/contacts.ts

- Transcript: runs/10-fix-phone-layout.log

## Reconciliation (2026-11-18 11:48Z)

The usage API updates with a lag of a few seconds to a minute, so runs 09 and 10 show "before = after"; their cost landed in later readings. Final reading after all runs settled: **23.62 of 50 used**. Build total (runs 01 to 10): 23.62 - 0.58 = **23.04 credits**, under the 35-credit build budget and inside the 25-credit core stop line. Remaining this month: 26.38, plus 50 on 2026-12-01.

Approximate per-run cost: 01 spec 1.28; 02 spec fixes + hooks 1.96; 03 T1-T3 2.37; 04 T4-T5 2.86; 05 T6-T8 5.16; 06 T9-T11 2.73; 07 T12-T14 4.19; 08 finish checks 0.89; 09 + 10 fixes about 1.6 combined.

Hooks observed firing during headless runs: privacy-guard ("Clean: no network access" lines, verbatim in run 07) and spec-sync (closing "checkboxes are already ticked" messages at the end of every implementation run).

## Second pass after independent review (2026-11-18, runs 11 to 16)

Same setup. Runner records credits before, waits 45 s after the run for the usage API to settle, then reads again. Run 14's status is the files Kiro touched in that run (run 13 was still uncommitted at the time).

## 11-fix-drill-skips
- Start 2026-11-18T11:55:45Z, end 2026-11-18T11:56:52Z (67s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 23.62 of 50.0; after: 25.06 of 50.0 (about 1.44)
- Prompt:

    Blocking bug found in independent review (browser test): the Dead Phone Drill skips cards.
    
    In src/ui/drill.ts handleAnswer() adds each Next/Finish button with feedbackEl.insertAdjacentElement("afterend", nextBtn), outside the card container. renderCard() only clears the card container and the feedback text, so the old button is never removed. Repro: Load demo data, Drill, Start Drill, answer card 1, press Next. A stale "Next" is still visible above card 2; clicking it jumps to card 3 and card 2 is never answered or scheduled. On card 3 the feedback area reads "FinishNextNext".
    
    Fix:
    1. Make sure exactly one Next/Finish button can exist at a time: remove any existing .drill-next when rendering a card (or render the button inside the per-card container), and guard handleAnswer against running twice for one card.
    2. Add a regression DOM test src/ui/drill.test.ts: load a 3-card session (use demoState or a small fixture), answer every card (one correct, one wrong, one correct) by typing into the input and submitting, click Next each time, and assert: only one .drill-next exists after every answer, cards appear in order 1 of 3, 2 of 3, 3 of 3, every card is answered exactly once, and the summary shows 2 correct, 1 missed. Use happy-dom (install with `npm install --save-dev --no-audit --no-fund happy-dom`), set the environment per file with a `// @vitest-environment happy-dom` comment, and widen vitest.config.ts include to also pick up src/ui/**/*.test.ts. Keep the src/lib coverage settings as they are.
    3. Add one acceptance criterion to the drill requirement in .kiro/specs/dead-phone-directory/requirements.md and a ticked task line in tasks.md for this regression test.
    
    Then run `npm test -- --run`, `npm run lint` and `npm run build`; fix until all pass. No em dashes. Do not git commit. Be economical.

- Files changed (git status vs last commit):

     M .kiro/specs/dead-phone-directory/requirements.md
     M .kiro/specs/dead-phone-directory/tasks.md
     M package-lock.json
     M package.json
     M src/ui/drill.ts
     M vitest.config.ts
    ?? src/ui/drill.test.ts

- Transcript: runs/11-fix-drill-skips.log

## 12-first-screen-pitch
- Start 2026-11-18T11:58:01Z, end 2026-11-18T12:04:21Z (380s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 25.06 of 50.0; after: 27.33 of 50.0 (about 2.27)
- Prompt:

    Review finding: a judge opening the live link sees an empty directory ("0/10 contacts, No contacts yet") with nothing saying what this is or that it is a Resurrection entry. Add a first-screen pitch. Follow .kiro/steering and keep the paper-directory style. Touch only index.html, src/main.ts, src/ui/demo.ts, src/ui/contacts.ts, src/styles/ and the spec files.
    
    1. Add an intro panel at the top of the Directory section (above the toolbar), shown when the directory has no contacts and dismissable once contacts exist (hide it automatically when contacts exist; no extra storage field needed):
       - Heading: "Your phone just died. Who can you still call?"
       - One line: "Dead Phone Directory brings back the paper home phone book, and the old habit of knowing the numbers that matter by heart."
       - Three short points: "Learn key numbers by heart with a 2-minute daily drill and a candle streak", "Print a true-size wallet card and a fridge sheet", "Private and offline: nothing leaves this device".
       - A large primary button "Try the demo" that loads demoState() (no confirm dialog when the directory is empty, keep the existing confirm when contacts exist) and then shows the Directory filled, and a secondary button "Start the drill" that switches to the Drill section (after loading demo data if empty).
       - Accessible: a real heading level h2 or h3 that fits the outline, buttons with clear names, works at 320px with no horizontal scroll.
    2. Copy fixes: the empty state says "Add your first contact below" but the Add button is above; change it to "No contacts yet. Add your first contact above, or try the demo." In the contact form, when phone validation fails, show "Enter a 10-digit number, or 911 or 988." to the user instead of the raw "Invalid 3-digit service number" message (keep phone.ts unchanged).
    3. Add a requirement acceptance criterion and a ticked tasks.md line for the intro panel.
    
    Then run `npm test -- --run`, `npm run lint` and `npm run build`; fix until all pass. No em dashes. Do not git commit. Be economical.

- Files changed (git status vs last commit):

     M .kiro/specs/dead-phone-directory/requirements.md
     M .kiro/specs/dead-phone-directory/tasks.md
     M index.html
     M src/main.ts
     M src/styles/directory.css
     M src/ui/contacts.ts
     M src/ui/demo.ts

- Transcript: runs/12-first-screen-pitch.log

## 13-polish
- Start 2026-11-18T12:06:44Z, end 2026-11-18T12:07:57Z (73s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 27.33 of 50.0; after: 29.63 of 50.0 (about 2.30)
- Prompt:

    Visual polish from browser review at 320px and 390px. Use CSS and minimal markup changes in src/styles/, index.html, src/ui/print.ts and src/ui/contacts.ts only. Keep the paper-directory style and .kiro/steering rules.
    
    1. Directory: the "+ Add Contact" button sits directly on top of the A-Z index tabs with no gap. Add comfortable vertical space between them.
    2. Header: the "Theme: ..." button uses a different (sans) font from the other buttons. Make it use the same font family, weight and size as the other secondary buttons. Also align the Import label vertically with the Export button.
    3. Emergency numbers at 320px: "Poison Control" wraps onto two lines next to "1 (800) 222-1222". Keep each emergency name on one line; when space is tight, put the number under the name instead (number still never wraps).
    4. Print section on screen:
       - The "Print wallet card" and "Print fridge sheet" buttons touch each other when they stack. Add a gap.
       - The on-screen wallet preview truncates phone numbers with an ellipsis ("(212) 555-01..."). On screen, never cut off a number: let the name wrap or truncate the name only, and keep the full number visible. Make the two previews look like a small card (front and back side by side when wide, stacked when narrow, rounded corners, card proportions) and a sheet. The real print CSS output must stay exactly as it is (true-size card, black on white).
       - Under the wallet button, add a short hint: "For a true-size card, print at 100% scale (Actual size), not Fit to page."
    5. In .kiro/specs/dead-phone-directory/tasks.md, T13 has the unticked item "Verify zero network requests at runtime". It was verified outside Kiro in a real headless browser (Playwright request log: only same-origin page, JS and CSS requests, 0 external, 2026-11-18). Tick it and append "(verified in browser QA, 2026-11-18)".
    
    Then run `npm test -- --run`, `npm run lint` and `npm run build`; fix until all pass. No em dashes. Do not git commit. Be economical.

- Files changed (git status vs last commit):

     M .kiro/specs/dead-phone-directory/tasks.md
     M src/styles/directory.css
     M src/styles/layout.css
     M src/styles/print.css
     M src/ui/print.ts

- Transcript: runs/13-polish.log

## 14-fix-wallet-preview
- Start 2026-11-18T12:09:17Z, end 2026-11-18T12:09:46Z (29s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 29.63 of 50.0; after: 30.27 of 50.0 (about 0.64)
- Prompt:

    Regression from the last change, seen at 320px in the Print section's on-screen wallet preview (src/ui/print.ts renderPreviewScreenOnly and src/styles/print.css, screen styles only):
    On the BACK face, the "Meet" and "Fallback" rows put the long value in .wallet-row-phone (nowrap, no shrink), so the label .wallet-row-name collapses to a single letter ("M Front yard oak tree (demo)") and the fallback label disappears. Also "Aunt Mavis (de..." and "Poison Cont..." are cut more than needed.
    Fix: only real phone numbers use the nowrap phone span. For the meeting place and fallback rows, render the label ("Meet:", "Fallback:") on its own and let the value wrap normally on the next line or after the label. Names may wrap to a second line instead of truncating on screen. Do not change any @media print rules. Run `npm run lint` and `npm run build`. No em dashes. Do not git commit. Be brief.

- Files changed (git status vs last commit):

     M src/styles/print.css
     M src/ui/print.ts

- Transcript: runs/14-fix-wallet-preview.log

## 15-custom-agent
- Start 2026-11-18T12:11:15Z, end 2026-11-18T12:12:17Z (62s), exit 0, model auto, trust-tools `read,write,run_command`
- Credits before: 30.27 of 50.0; after: 31.59 of 50.0 (about 1.32)
- Prompt:

    Create a Kiro custom agent for this repo. Do not change application code.
    
    File: .kiro/agents/qa-auditor.json (use the current Kiro CLI agent config format; you may check it with your introspect or help tools).
    - name "qa-auditor", short description: "Read-only accessibility and print-layout auditor for Dead Phone Directory. Drives a real headless browser through the Playwright MCP server and writes a findings report."
    - prompt: it audits the running app (a local preview URL given in the user message) against .kiro/specs/dead-phone-directory/requirements.md and .kiro/steering: keyboard reachability and focus order, accessible names, aria-live drill feedback, contrast-sensitive areas, 320px and 390px layout (no horizontal scroll, nothing clipped), the on-screen print previews, and that the page makes no request outside its own origin. It never edits files under src/, public/ or .kiro/; it only writes a dated Markdown report to docs/audits/. Each finding has severity, evidence (what was observed in the browser) and a suggested fix.
    - mcpServers: "playwright" running `npx -y @playwright/mcp@0.0.85 --headless --isolated`.
    - tools: read, write, the playwright MCP tools. allowedTools: read and the playwright tools only. Restrict write to docs/audits/** if the format supports path settings.
    - resources: the steering files and the spec requirements file.
    
    Then run `kiro-cli agent validate --path .kiro/agents/qa-auditor.json` (or the equivalent validate command) and fix until valid. Create docs/audits/.gitkeep. No em dashes. Do not git commit. Be brief.

- Files changed (git status vs last commit):

    ?? .kiro/agents/
    ?? docs/

- Transcript: runs/15-custom-agent.log

## 16-qa-auditor-mcp-audit
- Start 2026-11-18T12:13:11Z, end 2026-11-18T12:23:49Z (638s), exit 0, model auto, trust-tools `read,write,@playwright`, agent `qa-auditor`
- Credits before: 31.59 of 50.0; after: 40.44 of 50.0 (about 8.85)
- Prompt:

    Audit the current production build served at http://localhost:4173/dead-phone-directory/ . Use the Playwright MCP browser. Start with a fresh page, click "Try the demo", then cover the Directory, the Dead Phone Drill (answer at least two cards, one wrong), Plan and Print sections, at 390px and 320px widths. Check the network requests list for anything off-origin. Be economical: about 25 browser tool calls at most, prefer accessibility snapshots over screenshots. Write the dated report to docs/audits/ as your instructions say. Report only what you actually observed.

- Files changed (git status vs last commit):

    (no files changed; the report write was blocked, see notes)

- Transcript: runs/16-qa-auditor-mcp-audit.log

### Notes on runs 11 to 16

- Run 11 added a happy-dom regression test; Claude Code confirmed it fails on the pre-fix drill.ts (2 of 8 assertions) and passes after.
- Run 15 had Kiro write a custom agent, .kiro/agents/qa-auditor.json, with the Playwright MCP server (@playwright/mcp 0.0.85, run with npx, headless, isolated).
- Run 16 used that agent (`kiro-cli chat --agent qa-auditor`) against the local production preview. It drove a real headless browser through MCP (snapshots, clicks, typing, resize, network list) and produced a 7-finding report (1 medium, 6 low). Its own report write failed: the agent's permission rules included `deny fs_write **`, which overrode the `docs/audits/**` allow. Kiro printed the report instead. Claude Code copied it verbatim to docs/audits/2026-11-18-qa-audit.md and removed the deny rule from the agent config (kiro-cli agent validate passes; not re-run, to save credits).
- Run 16 was expensive (about 8.85 credits for a 10-minute browser session). Lesson: MCP browser audits cost several times a code-change run; cap tool calls harder or audit one section per run.

Second-pass total (runs 11 to 16): 40.44 - 23.62 = **16.82 credits**, about 1.8 over the 15-credit allowance for this pass because of run 16. Remaining this month: 9.56, plus 50 on 2026-12-01. No further Kiro runs in this pass.
