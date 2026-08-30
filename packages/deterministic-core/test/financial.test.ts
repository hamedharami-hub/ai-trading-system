import { describe, expect, it } from "vitest";
import {
  calculateNetRiskReward,
  calculatePositionSize,
  isTickAligned,
  quantizeQuantity,
} from "../src/math/financial.js";

describe("authoritative financial math", () => {
  it("rounds quantity down to step size", () => {
    expect(quantizeQuantity("1.258", "0.01")).toBe("1.25");
  });

  it("rejects off-tick prices instead of rounding them", () => {
    expect(isTickAligned("1.0851", "0.0001")).toBe(true);
    expect(isTickAligned("1.08515", "0.0001")).toBe(false);
  });

  it("calculates position size with Decimal values", () => {
    expect(
      calculatePositionSize({
        equity: "10000",
        riskPercent: "0.5",
        entryPrice: "2000",
        stopLossPrice: "1990",
        contractMultiplier: "1",
        stepSize: "0.1",
      }),
    ).toEqual({ riskAmount: "50", rawQuantity: "5", quantizedQuantity: "5" });
  });

  it("calculates net risk reward after costs", () => {
    expect(
      calculateNetRiskReward({
        entryPrice: "100",
        stopLossPrice: "95",
        targetPrice: "115",
        side: "BUY",
        roundTripCosts: "1",
      }),
    ).toBe("2.333333333333333333333333333333333");
  });
});
