import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isServiceNumber, normalise, format, PhoneError } from "./phone.ts";

// --- Unit tests ---

describe("isServiceNumber", () => {
  it("returns true for 911", () => expect(isServiceNumber("911")).toBe(true));
  it("returns true for 988", () => expect(isServiceNumber("988")).toBe(true));
  it("returns true for 211", () => expect(isServiceNumber("211")).toBe(true));
  it("returns true for 311", () => expect(isServiceNumber("311")).toBe(true));
  it("returns true for 411", () => expect(isServiceNumber("411")).toBe(true));
  it("returns true for 711", () => expect(isServiceNumber("711")).toBe(true));
  it("returns true for 811", () => expect(isServiceNumber("811")).toBe(true));
  it("returns false for 111", () => expect(isServiceNumber("111")).toBe(false));
  it("returns false for 011", () => expect(isServiceNumber("011")).toBe(false));
  it("returns false for 1234567890", () => expect(isServiceNumber("1234567890")).toBe(false));
  it("returns false for empty string", () => expect(isServiceNumber("")).toBe(false));
  it("returns false for 9880", () => expect(isServiceNumber("9880")).toBe(false));
});

describe("normalise", () => {
  it("passes through 10 digits unchanged", () => {
    expect(normalise("2125550100")).toBe("2125550100");
  });

  it("strips dashes", () => {
    expect(normalise("212-555-0100")).toBe("2125550100");
  });

  it("strips parens and spaces", () => {
    expect(normalise("(212) 555-0100")).toBe("2125550100");
  });

  it("strips dots", () => {
    expect(normalise("212.555.0100")).toBe("2125550100");
  });

  it("handles 11-digit with leading 1", () => {
    expect(normalise("12125550100")).toBe("12125550100");
  });

  it("handles 11-digit formatted with leading 1", () => {
    expect(normalise("1 (212) 555-0100")).toBe("12125550100");
  });

  it("handles service number 911", () => {
    expect(normalise("911")).toBe("911");
  });

  it("handles service number 988", () => {
    expect(normalise("988")).toBe("988");
  });

  it("handles Poison Control full number", () => {
    expect(normalise("1-800-222-1222")).toBe("18002221222");
  });

  it("throws PhoneError for empty string", () => {
    expect(() => normalise("")).toThrow(PhoneError);
  });

  it("throws PhoneError for letters only", () => {
    expect(() => normalise("abc")).toThrow(PhoneError);
  });

  it("throws PhoneError for 7 digits", () => {
    expect(() => normalise("5550100")).toThrow(PhoneError);
  });

  it("throws PhoneError for 11-digit not starting with 1", () => {
    expect(() => normalise("22125550100")).toThrow(PhoneError);
  });

  it("throws PhoneError for invalid area code starting with 1", () => {
    expect(() => normalise("1125550100")).toThrow(PhoneError);
  });

  it("throws PhoneError for invalid 3-digit non-service number", () => {
    expect(() => normalise("123")).toThrow(PhoneError);
  });
});

describe("format", () => {
  it("formats 10-digit number", () => {
    expect(format("2125550100")).toBe("(212) 555-0100");
  });

  it("formats 11-digit number with leading 1", () => {
    expect(format("12125550100")).toBe("1 (212) 555-0100");
  });

  it("formats 3-digit service number unchanged", () => {
    expect(format("911")).toBe("911");
    expect(format("988")).toBe("988");
  });

  it("formats Poison Control", () => {
    expect(format("18002221222")).toBe("1 (800) 222-1222");
  });
});

// --- Property-based tests ---

// Valid 10-digit NANP: area code 2xx, exchange 2xx, subscriber 0000-9999
const nanpDigits = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.integer({ min: 2, max: 9 }).map(String),
    fc.stringMatching(/^\d{2}$/),
    fc.integer({ min: 2, max: 9 }).map(String),
    fc.stringMatching(/^\d{2}$/),
    fc.stringMatching(/^\d{4}$/)
  ).map(([a1, a23, e1, e23, sub]) => `${a1}${a23}${e1}${e23}${sub}`);

const serviceDigits = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.constantFrom("211", "311", "411", "511", "611", "711", "811", "911", "988")
  );

const validNormalisedArb = (): fc.Arbitrary<string> =>
  fc.oneof(nanpDigits(), serviceDigits());

describe("P1: round-trip idempotence: normalise(format(normalise(x))) === normalise(x)", () => {
  it("holds for all valid normalised inputs", () => {
    fc.assert(
      fc.property(validNormalisedArb(), (n) => {
        expect(normalise(format(n))).toBe(n);
      })
    );
  });
});

describe("P2: format output never contains digit runs longer than 4", () => {
  it("holds for all valid normalised inputs", () => {
    fc.assert(
      fc.property(validNormalisedArb(), (n) => {
        const formatted = format(n);
        expect(/\d{5,}/.test(formatted)).toBe(false);
      })
    );
  });
});

describe("P3: raw 10-digit string passes through normalise unchanged", () => {
  it("holds for all valid 10-digit NANP inputs", () => {
    fc.assert(
      fc.property(nanpDigits(), (d) => {
        expect(normalise(d)).toBe(d);
      })
    );
  });
});

describe("P4: isServiceNumber matches /^[2-9]11$/ or equals '988'", () => {
  it("agrees with regex for all 3-char strings", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\d{3}$/), (s) => {
        const expected = /^[2-9]11$/.test(s) || s === "988";
        expect(isServiceNumber(s)).toBe(expected);
      })
    );
  });

  it("returns false for all non-3-char strings", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.length !== 3),
        (s) => {
          // 988 is 3 chars so won't appear here; just verify no crash and false result
          if (!/^[2-9]11$/.test(s) && s !== "988") {
            expect(isServiceNumber(s)).toBe(false);
          }
        }
      )
    );
  });
});
