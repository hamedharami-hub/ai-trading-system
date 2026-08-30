import { describe, it, expect } from "vitest";
import { parseDecimal, toDecimalString } from "../src/math/decimal.js";

describe("Arbitrary-Precision Decimal Math", () => {
  it("performs exact decimal arithmetic avoiding floating-point inaccuracies", () => {
    const a = parseDecimal("0.1");
    const b = parseDecimal("0.2");
    const sum = a.plus(b);
    expect(toDecimalString(sum)).toBe("0.3");
  });

  it("rejects invalid decimal strings or non-numeric strings", () => {
    expect(() => parseDecimal("abc")).toThrow();
    expect(() => parseDecimal("1.2.3")).toThrow();
    expect(() => parseDecimal("NaN")).toThrow();
    expect(() => parseDecimal("Infinity")).toThrow();
    expect(() => parseDecimal("1e5")).toThrow();
  });

  it("uses HALF_EVEN at explicitly quantized reporting boundaries", () => {
    expect(parseDecimal("2.5").toDecimalPlaces(0).toString()).toBe("2");
    expect(parseDecimal("3.5").toDecimalPlaces(0).toString()).toBe("4");
  });
});
