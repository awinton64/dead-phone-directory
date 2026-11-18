/**
 * Given a (possibly unsorted, possibly duplicate) array of ISO date strings
 * representing drill-log dates, returns the current and longest streaks.
 *
 * "Current" streak: how many consecutive calendar days ending on today (or
 * yesterday, when today has no entry yet) have at least one entry.
 * "Longest": historical maximum run of consecutive days.
 */
export function computeStreak(
  dates: string[],
  today: string // YYYY-MM-DD
): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  // Deduplicate and sort ascending.
  const unique = Array.from(new Set(dates)).sort();

  // Build runs of consecutive days.
  let longestRun = 1;
  let runLen = 1;
  for (let i = 1; i < unique.length; i++) {
    if (dayDiff(unique[i - 1]!, unique[i]!) === 1) {
      runLen++;
      if (runLen > longestRun) longestRun = runLen;
    } else {
      runLen = 1;
    }
  }

  // Determine current streak: the run that ends on today or yesterday.
  const yesterday = subtractOneDay(today);
  const lastEntry = unique[unique.length - 1]!;

  let current = 0;
  if (lastEntry === today || lastEntry === yesterday) {
    // Walk backwards from the last entry to find the run length.
    let streak = 1;
    for (let i = unique.length - 2; i >= 0; i--) {
      if (dayDiff(unique[i]!, unique[i + 1]!) === 1) {
        streak++;
      } else {
        break;
      }
    }
    current = streak;
  }

  return { current, longest: Math.max(longestRun, current) };
}

/** Returns how many days b is ahead of a (a < b assumed). */
function dayDiff(a: string, b: string): number {
  return (isoToUtcMs(b) - isoToUtcMs(a)) / 86_400_000;
}

function isoToUtcMs(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function subtractOneDay(iso: string): string {
  const ms = isoToUtcMs(iso) - 86_400_000;
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
