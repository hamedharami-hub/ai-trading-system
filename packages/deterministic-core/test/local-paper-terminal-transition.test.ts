import { describe, expect, it } from "vitest";

import { evaluateLocalPaperTerminalTransition } from "../src/paper/local-paper-terminal-transition.js";

describe("local Paper terminal transitions", () => {
  it("permits immutable terminal evidence only from a known nonterminal state", () => {
    const result = evaluateLocalPaperTerminalTransition(
      "RISK_APPROVED",
      "NO_TRADE",
      ["SIMULATED_LIFECYCLE_NOT_IMPLEMENTED"],
    );

    expect(result.status).toBe("ACCEPTED");
    expect(result.terminalSnapshot).toMatchObject({
      label: "PAPER_LOCAL_ONLY",
      state: "NO_TRADE",
      paperRecordsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      executionEligible: false,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("permits cancellation and rejection evidence without a trade artifact", () => {
    expect(
      evaluateLocalPaperTerminalTransition("DRAFT", "CANCELLED", [
        "OWNER_CANCELLED_LOCAL_REVIEW",
      ]).terminalSnapshot?.state,
    ).toBe("CANCELLED");
    expect(
      evaluateLocalPaperTerminalTransition("POLICY_ALLOWED", "REJECTED", [
        "POLICY_NOT_APPROVED",
      ]).terminalSnapshot?.state,
    ).toBe("REJECTED");
  });

  it("fails closed for terminal/unknown sources, nonterminal targets, or missing reasons", () => {
    expect(
      evaluateLocalPaperTerminalTransition("NO_TRADE", "CANCELLED", ["X"]),
    ).toMatchObject({
      status: "REJECTED",
      reasons: ["SOURCE_STATE_NOT_ELIGIBLE"],
      terminalSnapshot: undefined,
    });
    expect(
      evaluateLocalPaperTerminalTransition("UNKNOWN", "DRAFT", []),
    ).toMatchObject({
      status: "REJECTED",
      reasons: [
        "SOURCE_STATE_NOT_ELIGIBLE",
        "TARGET_STATE_NOT_TERMINAL",
        "TERMINAL_REASON_MISSING",
      ],
      terminalSnapshot: undefined,
    });
  });
});
