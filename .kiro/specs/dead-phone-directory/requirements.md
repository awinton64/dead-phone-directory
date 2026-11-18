# Requirements: Dead Phone Directory

## R1: Contact list

**US-1.** As a household member, I want to add a contact with name, relation, phone number, and a "must memorize" flag so that our key numbers are saved in one place.

1. WHEN a user submits a contact form THEN the system SHALL save the contact to localStorage and display it in the directory list.
2. WHEN the contact list already contains 10 contacts THEN the system SHALL disable the add-contact form and display an inline message explaining the 10-contact limit.
3. WHEN a user edits a saved contact THEN the system SHALL update that contact in localStorage and re-render the list without losing other contacts.
4. WHEN a user deletes a contact THEN the system SHALL remove it from localStorage and remove it from the rendered list.
5. WHEN the page loads THEN the system SHALL restore all contacts from localStorage and display them in alphabetical order by name.

**US-2.** As a household member, I want to see built-in emergency numbers so that they are always available without manual entry.

6. WHEN the directory is rendered THEN the system SHALL always display 911, 988 (Suicide and Crisis Lifeline), and Poison Control (1-800-222-1222) in a dedicated "Emergency" section that cannot be edited or deleted.

## R2: Household plan

**US-3.** As a household member, I want to record a meeting place and a fallback contact so that everyone knows where to go and who to call if phones are dead.

7. WHEN a user saves the household plan THEN the system SHALL persist the meeting-place text and fallback-contact text to localStorage.
8. WHEN the page loads THEN the system SHALL restore and display the saved household plan.

## R3: Phone number handling

**US-4.** As a user, I want phone numbers displayed in a consistent, readable format so that they are easy to read aloud or dial from memory.

9. WHEN a 10-digit US number is stored THEN the system SHALL display it in `(NXX) NXX-XXXX` format.
10. WHEN a 3-digit service number (e.g. 911, 988, 211) is entered or stored THEN the system SHALL display it as-is without reformatting.
11. WHEN a user enters a phone number THEN the system SHALL accept and normalise inputs that include spaces, dashes, dots, or parentheses before saving.
12. WHEN a phone number cannot be normalised to a valid US number or recognised service number THEN the system SHALL reject it with an accessible inline error message.

## R4: Print layouts

**US-5.** As a household member, I want to print a wallet card so that I can carry the most important numbers with me.

13. WHEN a user activates "Print wallet card" THEN the system SHALL trigger the browser print dialog with a layout sized to 3.375 × 2.125 in, showing flagged contacts on the front and the household plan on the back, using print CSS only.

**US-6.** As a household member, I want to print a fridge sheet so that everyone at home can see the full list.

14. WHEN a user activates "Print fridge sheet" THEN the system SHALL trigger the browser print dialog with a US Letter layout showing all contacts, emergency numbers, and the household plan, using print CSS only.

## R5: Dead Phone Drill

**US-7.** As a user, I want a daily drill that asks me to type phone numbers from memory so that I actually memorize them.

15. WHEN a user starts a drill session THEN the system SHALL present each contact flagged "must memorize" whose next-due date is today or earlier, one at a time, up to a maximum of 5 cards per session (earliest `nextDue` first).
16. WHEN no flagged contacts are due THEN the system SHALL display a "Nothing due today: come back tomorrow" message and not start a drill.
17. WHEN a user types digits for a number THEN the system SHALL normalise both the input and the stored number via `normalise()` before comparing; a match on normalised digits is correct regardless of formatting. On a correct answer the system SHALL advance that contact to the next Leitner box and show a confirmation via an `aria-live` region.
18. WHEN a user types incorrect digits THEN the system SHALL move that contact back to box 1, reveal the correct number, and show feedback via an `aria-live` region.
19. WHEN a drill session ends (all due cards answered) THEN the system SHALL record today's ISO date in the drill log and update the streak display.
20. WHEN a user is drilling THEN the system SHALL allow completing the entire session using keyboard only (no mouse required).
21. WHEN a user answers a card and presses Next THEN the system SHALL display exactly one Next/Finish button at a time, present each card exactly once in order, and prevent a second answer submission on the same card.

**US-8.** As a user, I want a daily streak counter so that I am motivated to drill every day.

21. WHEN a drill session is completed THEN the system SHALL increment the streak if yesterday's date is already in the drill log, or start a new streak of 1 if it is not.
22. WHEN the streak is displayed THEN the system SHALL show the current streak count and the longest streak count.

## R6: Spaced-repetition scheduler

**US-9.** As a system, I want a deterministic Leitner-box scheduler so that drill intervals are predictable and testable without mocking time.

23. WHEN a contact is first added with "must memorize" THEN the system SHALL place it in box 1 with a next-due date of today.
24. WHEN a correct answer is recorded for a contact in box N THEN the system SHALL move it to box N+1 (max box 5) and set its next-due date to today + 2^(N−1) days.
25. WHEN an incorrect answer is recorded THEN the system SHALL move the contact to box 1 and set its next-due date to today.
26. WHEN computing due dates THEN the system SHALL use the local calendar date (YYYY-MM-DD) with no dependency on wall-clock time beyond `new Date().toLocaleDateString('en-CA')`.

## R7: Data management

**US-10.** As a user, I want to load demo data so that I can explore the app without entering real contacts.

27. WHEN a user activates "Load demo data" THEN the system SHALL replace the current contact list with synthetic contacts using 555-01xx phone numbers and display a notice that the data is fictional.
28. WHEN demo data is loaded THEN the system SHALL include at least one contact per relation category and at least two contacts flagged "must memorize."

**US-11.** As a user, I want to export and import my data as JSON so that I can back it up or move it to another device.

29. WHEN a user activates "Export" THEN the system SHALL download a JSON file containing all contacts, the household plan, and the drill log in the versioned storage schema.
30. WHEN a user imports a JSON file THEN the system SHALL validate it against the storage schema, migrate it if the version is older, and replace the current data only if validation passes; otherwise it SHALL display an accessible error message.

## R8: Offline and static deployment

**US-12.** As a user, I want the app to work without an internet connection after the first load.

31. WHEN the app is loaded for the first time THEN the browser SHALL cache all assets via a service worker so that subsequent loads work offline.
32. WHEN the app makes any runtime operation THEN the system SHALL make zero network requests (no analytics, no CDN fonts, no external APIs).

## R9: Accessibility and presentation

**US-13.** As a user with accessibility needs, I want the app to meet WCAG 2.2 AA so that I can use it with assistive technology.

33. WHEN any interactive element is rendered THEN the system SHALL provide a visible label and a logical tab order.
34. WHEN a drill answer is submitted THEN the system SHALL announce the result in an `aria-live="polite"` region.
35. WHEN the user has `prefers-reduced-motion: reduce` set THEN the system SHALL suppress all CSS transitions and animations.

**US-14.** As a user, I want a dark mode so that I can use the app comfortably in low light.

36. WHEN the system detects `prefers-color-scheme: dark` THEN the system SHALL apply the dark palette automatically.
37. WHEN a user toggles the theme control THEN the system SHALL switch between light and dark palettes and persist the choice to localStorage.
