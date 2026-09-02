import { describe, expect, it } from "vitest";
import { evaluateLocalPaperDenyOnlyRisk } from "../src/paper/local-paper-deny-only-risk.js";

describe("local Paper deny-only risk", () => {
  it("never calculates or approves risk", () => {
    expect(evaluateLocalPaperDenyOnlyRisk()).toEqual({
      status: "NO_TRADE",
      label: "PAPER_LOCAL_ONLY",
      riskApproved: false,
      reasons: ["RISK_MODEL_NOT_APPROVED"],
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      externalRequestsMade: 0,
      executionEligible: false,
    });
  });
});
