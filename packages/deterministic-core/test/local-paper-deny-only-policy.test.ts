import { describe, expect, it } from "vitest";
import { evaluateLocalPaperDenyOnlyPolicy } from "../src/paper/local-paper-deny-only-policy.js";

describe("local Paper deny-only policy", () => {
  it("never approves a candidate or creates an artifact", () => {
    expect(evaluateLocalPaperDenyOnlyPolicy()).toEqual({
      status: "NO_TRADE",
      label: "PAPER_LOCAL_ONLY",
      policyApproved: false,
      reasons: ["POLICY_RULES_NOT_APPROVED"],
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      externalRequestsMade: 0,
      executionEligible: false,
    });
  });
});
