import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { intervalDays, recordCorrect, recordIncorrect, isDue } from "./scheduler.ts";
import type { Box } from "./scheduler.ts";

const ALL_BOXES: Box[] = [1, 2, 3, 4, 5];

// --- Unit tests ---

describe("intervalDays", () => {
  it("box 1 → 1 day", () => expect(intervalDays(1)).toBe(1));
  it("box 2 → 2 days", () => expect(intervalDays(2)).toBe(2));
  it("box 3 → 4 days", () => expect(intervalDays(3)).toBe(4));
  it("box 4 → 8 days", () => expect(intervalDays(4)).toBe(8));
  it("box 5 → 16 days", () => expect(intervalDays(5)).toBe(16));
});

describe("recordCorrect", () => {
  it("advances box 1 → 2, due in 2 days", () => {
    const { box, nextDue } = recordCorrect("2024-01-01", 1);
    expect(box).toBe(2);
    expect(nextDue).toBe("2024-01-03");
  });

  it("advances box 2 → 3, due in 4 days", () => {
    const { box, nextDue } = recordCorrect("2024-01-01", 2);
    expect(box).toBe(3);
    expect(nextDue).toBe("2024-01-05");
  });

  it("advances box 3 → 4, due in 8 days", () => {
    const { box, nextDue } = recordCorrect("2024-01-01", 3);
    expect(box).toBe(4);
    expect(nextDue).toBe("2024-01-09");
  });

  it("advances box 4 → 5, due in 16 days", () => {
    const { box, nextDue } = recordCorrect("2024-01-01", 4);
    expect(box).toBe(5);
    expect(nextDue).toBe("2024-01-17");
  });

  it("caps box at 5, due in 16 days", () => {
    const { box, nextDue } = recordCorrect("2024-01-01", 5);
    expect(box).toBe(5);
    expect(nextDue).toBe("2024-01-17");
  });

  it("handles month rollover correctly", () => {
    const { nextDue } = recordCorrect("2024-01-30", 2);
    // box 3, interval 4 days → 2024-02-03
    expect(nextDue).toBe("2024-02-03");
  });

  it("handles year rollover correctly", () => {
    const { nextDue } = recordCorrect("2024-12-31", 1);
    // box 2, interval 2 days → 2025-01-02
    expect(nextDue).toBe("2025-01-02");
  });

  it("handles leap day correctly", () => {
    const { nextDue } = recordCorrect("2024-02-28", 1);
    // box 2, interval 2 days → 2024-03-01
    expect(nextDue).toBe("2024-03-01");
  });
});

describe("recordIncorrect", () => {
  it("resets box to 1", () => {
    expect(recordIncorrect("2024-06-15").box).toBe(1);
  });

  it("sets nextDue to today", () => {
    expect(recordIncorrect("2024-06-15").nextDue).toBe("2024-06-15");
  });

  it("resets from box 5", () => {
    const { box, nextDue } = recordIncorrect("2024-01-01");
    expect(box).toBe(1);
    expect(nextDue).toBe("2024-01-01");
  });
});

describe("isDue", () => {
  it("returns true when nextDue equals today", () => {
    expect(isDue("2024-06-15", "2024-06-15")).toBe(true);
  });

  it("returns true when nextDue is in the past", () => {
    expect(isDue("2024-06-01", "2024-06-15")).toBe(true);
  });

  it("returns false when nextDue is in the future", () => {
    expect(isDue("2024-06-20", "2024-06-15")).toBe(false);
  });

  it("returns false one day before due", () => {
    expect(isDue("2024-06-16", "2024-06-15")).toBe(false);
  });

  it("returns true one day after due", () => {
    expect(isDue("2024-06-14", "2024-06-15")).toBe(true);
  });
});

// --- Property-based tests ---

const boxArb = (): fc.Arbitrary<Box> =>
  fc.constantFrom<Box>(1, 2, 3, 4, 5);

const isoDateArb = (): fc.Arbitrary<string> =>
  fc.date({
    min: new Date("2000-01-01"),
    max: new Date("2099-12-31"),
  }).map((d) => {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

describe("P5 — intervalDays(box) === 2^(box-1) for all boxes", () => {
  it("holds for all 5 boxes", () => {
    fc.assert(
      fc.property(boxArb(), (box) => {
        expect(intervalDays(box)).toBe(Math.pow(2, box - 1));
      })
    );
  });
});

describe("P6 — after recordCorrect, newBox === Math.min(box + 1, 5)", () => {
  it("holds for all boxes and dates", () => {
    fc.assert(
      fc.property(isoDateArb(), boxArb(), (today, box) => {
        const { box: newBox } = recordCorrect(today, box);
        expect(newBox).toBe(Math.min(box + 1, 5));
      })
    );
  });
});

describe("P7 — after any sequence of correct/incorrect answers, box is always in {1,2,3,4,5}", () => {
  type Action = "correct" | "incorrect";
  const actionArb = (): fc.Arbitrary<Action> =>
    fc.constantFrom<Action>("correct", "incorrect");

  it("holds for arbitrary answer sequences", () => {
    fc.assert(
      fc.property(
        isoDateArb(),
        fc.array(actionArb(), { minLength: 1, maxLength: 20 }),
        (today, actions) => {
          let box: Box = 1;
          for (const action of actions) {
            if (action === "correct") {
              ({ box } = recordCorrect(today, box));
            } else {
              ({ box } = recordIncorrect(today));
            }
            expect(ALL_BOXES).toContain(box);
          }
        }
      )
    );
  });
});

describe("P8 — isDue(nextDue, today) is equivalent to nextDue <= today", () => {
  it("holds for all date pairs", () => {
    fc.assert(
      fc.property(isoDateArb(), isoDateArb(), (nextDue, today) => {
        expect(isDue(nextDue, today)).toBe(nextDue <= today);
      })
    );
  });
});
