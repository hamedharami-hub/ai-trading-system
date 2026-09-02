import { describe, expect, it } from "vitest";
import { evaluateLocalPaperAdmission } from "../src/paper/local-paper-admission.js";
import { evaluatePolicyGate } from "../src/policy/policy-gate.js";
import { prepareHistoricalReplay } from "../src/replay/historical-replay-runner.js";
import { evaluateRisk } from "../src/risk/risk-engine.js";

const SHA256 = "a".repeat(64);
const VALID_CSV = [
  "Etc/UTC,Open,High,Low,Close,Volume",
  "2025-08-01T00:00:00+00:00,1.14217,1.14217,1.14192,1.14194,101130000",
].join("\n");

function approvedPolicy() {
  return evaluatePolicyGate({
    dataHealth: "GREEN",
    sessionPermitted: true,
    newsBlackout: false,
    candidateValid: true,
    candidateExpired: false,
    analyticalConflict: false,
    judgeRequired: false,
  });
}

function approvedRisk() {
  return evaluateRisk({
    tier: "A",
    policyApproved: true,
    netRiskReward: "2",
    dailyLossPercent: "0",
    drawdownPercent: "0",
    currentOpenRiskPercent: "0",
    correlationOpenRiskPercent: "0",
    concurrentPositions: 0,
    counterTrend: false,
    executionMode: "MANUAL_CONFIRM",
    eliteConditionsPassed: false,
  });
}

const COMPLETE_ASSUMPTIONS = {
  costAssumptionsRecorded: true,
  partialFillAssumptionsRecorded: true,
  protectiveOrderModelAvailable: true,
  reconciliationPlanAvailable: true,
} as const;

describe("local Paper Trading admission", () => {
  it("fails closed with zero Paper artifacts even when local prerequisites exist", () => {
    const replay = prepareHistoricalReplay({
      datasetId: "eurusd-m1-sample",
      expectedSha256: SHA256,
      actualSha256: SHA256,
      csvText: VALID_CSV,
    });

    expect(
      evaluateLocalPaperAdmission(
        replay,
        approvedPolicy(),
        approvedRisk(),
        COMPLETE_ASSUMPTIONS,
      ),
    ).toEqual({
      status: "NO_TRADE",
      replayStatus: "REPLAY_READY",
      sourceKind: "REPLAY",
      localOnly: true,
      reasons: ["SIMULATED_LIFECYCLE_NOT_IMPLEMENTED"],
      paperRecordsCreated: 0,
      simulatedFillsCreated: 0,
      profitLossCalculated: false,
      externalRequestsMade: 0,
      executionEligible: false,
    });
  });

  it("records every missing prerequisite without creating a simulated trade", () => {
    const rejectedReplay = prepareHistoricalReplay({
      datasetId: "changed-file",
      expectedSha256: SHA256,
      actualSha256: "b".repeat(64),
      csvText: VALID_CSV,
    });

    const result = evaluateLocalPaperAdmission(
      rejectedReplay,
      evaluatePolicyGate({
        dataHealth: "INVALID",
        sessionPermitted: false,
        newsBlackout: true,
        candidateValid: false,
        candidateExpired: true,
        analyticalConflict: false,
        judgeRequired: false,
      }),
      evaluateRisk({
        tier: "A",
        policyApproved: false,
        netRiskReward: "0",
        dailyLossPercent: "0",
        drawdownPercent: "0",
        currentOpenRiskPercent: "0",
        correlationOpenRiskPercent: "0",
        concurrentPositions: 0,
        counterTrend: false,
        executionMode: "ANALYSIS_ONLY",
        eliteConditionsPassed: false,
      }),
      {
        costAssumptionsRecorded: false,
        partialFillAssumptionsRecorded: false,
        protectiveOrderModelAvailable: false,
        reconciliationPlanAvailable: false,
      },
    );

    expect(result.status).toBe("NO_TRADE");
    expect(result.reasons).toEqual([
      "REPLAY_UNAVAILABLE",
      "POLICY_NOT_APPROVED",
      "RISK_NOT_APPROVED",
      "COST_ASSUMPTIONS_MISSING",
      "PARTIAL_FILL_ASSUMPTIONS_MISSING",
      "PROTECTIVE_ORDER_MODEL_UNAVAILABLE",
      "RECONCILIATION_PLAN_MISSING",
      "SIMULATED_LIFECYCLE_NOT_IMPLEMENTED",
    ]);
    expect(result.paperRecordsCreated).toBe(0);
    expect(result.simulatedFillsCreated).toBe(0);
    expect(result.profitLossCalculated).toBe(false);
    expect(result.executionEligible).toBe(false);
  });
});
