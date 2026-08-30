import { describe, expect, it } from "vitest";
import { evaluatePolicyGate } from "../src/policy/policy-gate.js";
import { evaluateRisk } from "../src/risk/risk-engine.js";

describe("policy and risk gates", () => {
  it("fails closed for stale data", () => {
    expect(
      evaluatePolicyGate({
        dataHealth: "STALE",
        sessionPermitted: true,
        newsBlackout: false,
        candidateValid: true,
        candidateExpired: false,
        analyticalConflict: false,
        judgeRequired: false,
      }),
    ).toEqual({ approved: false, reasons: ["DATA_STALE"] });
  });

  it("requires conditional Judge approval without giving Judge risk authority", () => {
    const decision = evaluatePolicyGate({
      dataHealth: "GREEN",
      sessionPermitted: true,
      newsBlackout: false,
      candidateValid: true,
      candidateExpired: false,
      analyticalConflict: true,
      judgeRequired: true,
      judgeDecision: "APPROVE",
    });
    expect(decision.approved).toBe(true);
  });

  it("enforces approved adaptive and portfolio caps", () => {
    const approved = evaluateRisk({
      tier: "A_PLUS",
      policyApproved: true,
      netRiskReward: "1.5",
      dailyLossPercent: "0",
      drawdownPercent: "0",
      currentOpenRiskPercent: "0.25",
      correlationOpenRiskPercent: "0",
      concurrentPositions: 0,
      counterTrend: false,
      executionMode: "MANUAL_CONFIRM",
      eliteConditionsPassed: false,
    });
    expect(approved).toEqual({
      approved: true,
      approvedRiskPercent: "0.5",
      reasons: [],
    });

    const rejected = evaluateRisk({
      tier: "A_PLUS",
      policyApproved: true,
      netRiskReward: "2",
      dailyLossPercent: "0",
      drawdownPercent: "0",
      currentOpenRiskPercent: "0.75",
      correlationOpenRiskPercent: "0",
      concurrentPositions: 0,
      counterTrend: false,
      executionMode: "MANUAL_CONFIRM",
      eliteConditionsPassed: false,
    });
    expect(rejected.approved).toBe(false);
    expect(rejected.reasons).toContain("PORTFOLIO_OPEN_RISK_CAP");
  });

  it("halves risk at three percent drawdown and stops at five percent", () => {
    const reduced = evaluateRisk({
      tier: "A_PLUS",
      policyApproved: true,
      netRiskReward: "2",
      dailyLossPercent: "0",
      drawdownPercent: "3",
      currentOpenRiskPercent: "0",
      correlationOpenRiskPercent: "0",
      concurrentPositions: 0,
      counterTrend: false,
      executionMode: "MANUAL_CONFIRM",
      eliteConditionsPassed: false,
    });
    expect(reduced.approvedRiskPercent).toBe("0.25");

    const stopped = evaluateRisk({
      ...{
        tier: "A_PLUS" as const,
        policyApproved: true,
        netRiskReward: "2",
        dailyLossPercent: "0",
        drawdownPercent: "5",
        currentOpenRiskPercent: "0",
        correlationOpenRiskPercent: "0",
        concurrentPositions: 0,
        counterTrend: false,
        executionMode: "MANUAL_CONFIRM" as const,
        eliteConditionsPassed: false,
      },
    });
    expect(stopped.approved).toBe(false);
    expect(stopped.approvedRiskPercent).toBe("0");
  });

  it("fails closed for impossible negative portfolio state", () => {
    const decision = evaluateRisk({
      tier: "A",
      policyApproved: true,
      netRiskReward: "2",
      dailyLossPercent: "-1",
      drawdownPercent: "0",
      currentOpenRiskPercent: "0",
      correlationOpenRiskPercent: "0",
      concurrentPositions: -1,
      counterTrend: false,
      executionMode: "MANUAL_CONFIRM",
      eliteConditionsPassed: false,
    });
    expect(decision.approved).toBe(false);
    expect(decision.reasons).toContain("INVALID_NEGATIVE_STATE");
    expect(decision.reasons).toContain("INVALID_POSITION_COUNT");
  });
});
