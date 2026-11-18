export class PhoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhoneError";
  }
}

/**
 * Returns true for N11 codes (/^[2-9]11$/) and for "988".
 * Note: 988 matches both the N11 pattern and this explicit check.
 */
export function isServiceNumber(raw: string): boolean {
  return /^[2-9]11$/.test(raw) || raw === "988";
}

/**
 * Strips formatting characters and returns digits only, or throws PhoneError.
 * Accepts: 3-digit service numbers, 10-digit, 11-digit starting with 1.
 */
export function normalise(raw: string): string {
  if (typeof raw !== "string") {
    throw new PhoneError("Input must be a string");
  }

  // Strip all non-digit characters (spaces, dashes, dots, parens, plus)
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 0) {
    throw new PhoneError(`No digits found in: ${JSON.stringify(raw)}`);
  }

  // 3-digit service number (911, 988, 211, etc.)
  if (digits.length === 3) {
    if (isServiceNumber(digits)) {
      return digits;
    }
    throw new PhoneError(`Invalid 3-digit service number: ${digits}`);
  }

  // 10-digit US number
  if (digits.length === 10) {
    validateNanp(digits);
    return digits;
  }

  // 11-digit: must start with 1
  if (digits.length === 11) {
    if (digits[0] !== "1") {
      throw new PhoneError(`11-digit number must start with 1, got: ${digits}`);
    }
    const local = digits.slice(1);
    validateNanp(local);
    return digits;
  }

  throw new PhoneError(
    `Phone number must be 3, 10, or 11 digits; got ${digits.length} in: ${JSON.stringify(raw)}`
  );
}

function validateNanp(tenDigits: string): void {
  // Area code first digit must be 2–9
  if (!/^[2-9]/.test(tenDigits)) {
    throw new PhoneError(`Invalid NANP area code in: ${tenDigits}`);
  }
  // Exchange code first digit must be 2–9
  if (!/^[2-9]\d{2}[2-9]/.test(tenDigits)) {
    throw new PhoneError(`Invalid NANP exchange code in: ${tenDigits}`);
  }
}

/**
 * Formats a normalised phone string for display.
 *   10-digit  → "(NXX) NXX-XXXX"
 *   3-digit   → "911", "988", etc.
 *   11-digit starting with 1 → "1 (NXX) NXX-XXXX"
 */
export function format(normalised: string): string {
  if (normalised.length === 3) {
    return normalised;
  }

  if (normalised.length === 10) {
    const area = normalised.slice(0, 3);
    const exchange = normalised.slice(3, 6);
    const subscriber = normalised.slice(6, 10);
    return `(${area}) ${exchange}-${subscriber}`;
  }

  if (normalised.length === 11 && normalised[0] === "1") {
    const area = normalised.slice(1, 4);
    const exchange = normalised.slice(4, 7);
    const subscriber = normalised.slice(7, 11);
    return `1 (${area}) ${exchange}-${subscriber}`;
  }

  throw new PhoneError(`Cannot format: ${JSON.stringify(normalised)}`);
}
