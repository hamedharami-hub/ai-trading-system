import { describe, expect, it } from "vitest";
import { screenLocalPaperCandidate } from "../src/index.js";

const candidate = {
  policy: {
    dataHealth: "GREEN" as const,
    sessionPermitted: true,
    newsBlackout: false,
    candidateValid: true,
    candidateExpired: false,
    analyticalConflict: false,
    judgeRequired: false,
  },
  risk: {
    tier: "A_PLUS" as const,
    netRiskReward: "2",
    dailyLossPercent: "0",
    drawdownPercent: "0",
    currentOpenRiskPercent: "0",
    correlationOpenRiskPercent: "0",
    concurrentPositions: 0,
    counterTrend: false,
    executionMode: "MANUAL_CONFIRM" as const,
    eliteConditionsPassed: false,
  },
};

describe("local Paper candidate screening", () => {
  it("derives risk policy approval and remains non-executable", () => {
    expect(screenLocalPaperCandidate(candidate)).toEqual({
      status: "NO_TRADE",
      label: "PAPER_LOCAL_ONLY",
      reasons: ["SIMULATED_LIFECYCLE_NOT_IMPLEMENTED"],
      policy: { approved: true, reasons: [] },
      risk: { approved: true, approvedRiskPercent: "0.5", reasons: [] },
      orderIntentsCreated: 0,
      simulatedFillsCreated: 0,
      positionsCreated: 0,
      profitLossCalculated: false,
      persistenceMutations: 0,
      externalRequestsMade: 0,
      executionEligible: false,
    });
  });

  it("fails closed through risk when policy rejects", () => {
    const result = screenLocalPaperCandidate({
      ...candidate,
      policy: { ...candidate.policy, dataHealth: "STALE" },
    });

    expect(result.status).toBe("NO_TRADE");
    expect(result.policy).toEqual({ approved: false, reasons: ["DATA_STALE"] });
    expect(result.risk.approved).toBe(false);
    expect(result.risk.reasons).toContain("POLICY_REJECTED");
    expect(result.orderIntentsCreated).toBe(0);
    expect(result.executionEligible).toBe(false);
  });
});
