export type Box = 1 | 2 | 3 | 4 | 5;

/** Interval in days for each box: box N → 2^(N-1) days. */
export function intervalDays(box: Box): number {
  return Math.pow(2, box - 1);
}

/**
 * Add `days` to an ISO date string (YYYY-MM-DD) using UTC day math
 * to avoid any DST / timezone bugs.
 */
function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const utcMs = Date.UTC(y, m - 1, d) + days * 86_400_000;
  const result = new Date(utcMs);
  const yyyy = result.getUTCFullYear();
  const mm = String(result.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(result.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns the next-due ISO date after a correct answer.
 * box advances by 1 (capped at 5); due = today + intervalDays(newBox).
 */
export function recordCorrect(
  today: string,
  box: Box
): { box: Box; nextDue: string } {
  const newBox = (Math.min(box + 1, 5) as Box);
  const nextDue = addDays(today, intervalDays(newBox));
  return { box: newBox, nextDue };
}

/**
 * Returns the next-due ISO date after an incorrect answer.
 * box resets to 1; due = today.
 */
export function recordIncorrect(today: string): { box: Box; nextDue: string } {
  return { box: 1, nextDue: today };
}

/** Returns true if nextDue <= today (both YYYY-MM-DD). */
export function isDue(nextDue: string, today: string): boolean {
  return nextDue <= today;
}
