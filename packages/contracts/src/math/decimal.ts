import { Decimal } from "decimal.js";

// Configure high-precision financial decimal environment
Decimal.set({
  precision: 34, // Standard IEEE 754 decimal128 precision
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -12,
  toExpPos: 20,
});

const DECIMAL_REGEX = /^-?(0|[1-9]\d*)(\.\d+)?$/;

/**
 * Validates and converts an arbitrary precision string to a Decimal instance.
 * Throws an error if input is not a canonical decimal string or is NaN/Infinity.
 */
export function parseDecimal(value: string | Decimal): Decimal {
  if (value instanceof Decimal) {
    if (!value.isFinite()) {
      throw new Error(`Invalid non-finite Decimal value: ${value.toString()}`);
    }
    return value;
  }

  if (typeof value !== "string" || !DECIMAL_REGEX.test(value.trim())) {
    throw new Error(
      `Invalid decimal string format: "${value}". Must match ^-?(0|[1-9]\\d*)(\\.\\d+)?$`,
    );
  }

  const d = new Decimal(value.trim());
  if (!d.isFinite()) {
    throw new Error(`Decimal value evaluates to non-finite: "${value}"`);
  }
  return d;
}

/**
 * Formats a Decimal value to a canonical string representation (never scientific notation).
 */
export function toDecimalString(d: Decimal | string): string {
  const dec = parseDecimal(d);
  return dec.toFixed();
}

/**
 * Quantizes order quantity by rounding DOWN to the venue's stepSize (DEC-041).
 * Example: qty = 1.258, stepSize = 0.01 -> 1.25
 */
export { Decimal };
