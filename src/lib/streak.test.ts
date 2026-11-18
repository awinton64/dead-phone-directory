import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeStreak } from "./streak.ts";

// --- Unit tests ---

describe("computeStreak — empty log", () => {
  it("returns {current:0, longest:0}", () => {
    expect(computeStreak([], "2024-06-15")).toEqual({ current: 0, longest: 0 });
  });
});

describe("computeStreak — single entry", () => {
  it("entry is today → current 1, longest 1", () => {
    expect(computeStreak(["2024-06-15"], "2024-06-15")).toEqual({
      current: 1,
      longest: 1,
    });
  });

  it("entry is yesterday → current 1, longest 1", () => {
    expect(computeStreak(["2024-06-14"], "2024-06-15")).toEqual({
      current: 1,
      longest: 1,
    });
  });

  it("entry is two days ago → current 0, longest 1", () => {
    expect(computeStreak(["2024-06-13"], "2024-06-15")).toEqual({
      current: 0,
      longest: 1,
    });
  });
});

describe("computeStreak — consecutive days", () => {
  it("three consecutive days ending today → current 3", () => {
    expect(
      computeStreak(["2024-06-13", "2024-06-14", "2024-06-15"], "2024-06-15")
    ).toEqual({ current: 3, longest: 3 });
  });

  it("three consecutive days ending yesterday → current 3", () => {
    expect(
      computeStreak(["2024-06-12", "2024-06-13", "2024-06-14"], "2024-06-15")
    ).toEqual({ current: 3, longest: 3 });
  });

  it("five days with a gap → current streak is tail run only", () => {
    // Run of 2 (06-10, 06-11), gap, run of 3 (06-13, 06-14, 06-15)
    const dates = ["2024-06-10", "2024-06-11", "2024-06-13", "2024-06-14", "2024-06-15"];
    expect(computeStreak(dates, "2024-06-15")).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it("gap breaks current streak even when longer run exists earlier", () => {
    // Run of 4 (06-01..06-04), gap, run of 1 ending today
    const dates = ["2024-06-01", "2024-06-02", "2024-06-03", "2024-06-04", "2024-06-15"];
    expect(computeStreak(dates, "2024-06-15")).toEqual({
      current: 1,
      longest: 4,
    });
  });
});

describe("computeStreak — duplicates", () => {
  it("duplicate entries for the same day do not inflate the streak", () => {
    expect(
      computeStreak(
        ["2024-06-13", "2024-06-13", "2024-06-14", "2024-06-14", "2024-06-15"],
        "2024-06-15"
      )
    ).toEqual({ current: 3, longest: 3 });
  });

  it("all duplicates of a single day → current 1", () => {
    expect(
      computeStreak(["2024-06-15", "2024-06-15", "2024-06-15"], "2024-06-15")
    ).toEqual({ current: 1, longest: 1 });
  });
});

describe("computeStreak — longest vs current", () => {
  it("longest is always >= current", () => {
    const dates = ["2024-06-01", "2024-06-02", "2024-06-03", "2024-06-15"];
    const { current, longest } = computeStreak(dates, "2024-06-15");
    expect(longest).toBeGreaterThanOrEqual(current);
  });

  it("past run longer than current tail", () => {
    const dates = [
      "2024-05-01", "2024-05-02", "2024-05-03", "2024-05-04", "2024-05-05",
      "2024-06-14", "2024-06-15",
    ];
    expect(computeStreak(dates, "2024-06-15")).toEqual({
      current: 2,
      longest: 5,
    });
  });
});

describe("computeStreak — unsorted input", () => {
  it("handles unsorted dates correctly", () => {
    expect(
      computeStreak(["2024-06-15", "2024-06-13", "2024-06-14"], "2024-06-15")
    ).toEqual({ current: 3, longest: 3 });
  });
});

// --- Property-based tests ---

const isoDateArb = (): fc.Arbitrary<string> =>
  fc.date({
    min: new Date("2020-01-01"),
    max: new Date("2029-12-31"),
  }).map((d) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

describe("P9 — computeStreak([], today).current === 0", () => {
  it("holds for all today values", () => {
    fc.assert(
      fc.property(isoDateArb(), (today) => {
        expect(computeStreak([], today).current).toBe(0);
      })
    );
  });
});

describe("P10 — list containing only today → current === 1", () => {
  it("holds for all today values", () => {
    fc.assert(
      fc.property(isoDateArb(), (today) => {
        expect(computeStreak([today], today).current).toBe(1);
      })
    );
  });
});

describe("P11 — longest >= current always", () => {
  it("holds for arbitrary date lists and today", () => {
    fc.assert(
      fc.property(
        fc.array(isoDateArb(), { maxLength: 20 }),
        isoDateArb(),
        (dates, today) => {
          const { current, longest } = computeStreak(dates, today);
          expect(longest).toBeGreaterThanOrEqual(current);
        }
      )
    );
  });
});

describe("P12 — duplicates do not increase streak beyond deduplicated list", () => {
  it("holds for arbitrary date lists and today", () => {
    fc.assert(
      fc.property(
        fc.array(isoDateArb(), { minLength: 1, maxLength: 20 }),
        isoDateArb(),
        (dates, today) => {
          const withDups = [...dates, ...dates]; // double every entry
          const r1 = computeStreak(dates, today);
          const r2 = computeStreak(withDups, today);
          expect(r2.current).toBe(r1.current);
          expect(r2.longest).toBe(r1.longest);
        }
      )
    );
  });
});
