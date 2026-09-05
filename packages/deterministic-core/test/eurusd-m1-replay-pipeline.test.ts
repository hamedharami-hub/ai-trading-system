import { describe, it, expect } from "vitest";
import type { StrategyCandidatePayload } from "@trade/contracts";
import { createDeterministicUuidV7 } from "../src/replay/eurusd-m1-strategy-candidate-evaluator.js";
import { runEurUsdM1ReplayPipeline } from "../src/replay/eurusd-m1-replay-pipeline.js";

function createCandidateFixture(
  overrides?: Partial<StrategyCandidatePayload>,
): StrategyCandidatePayload {
  return {
    candidate_id: createDeterministicUuidV7(1754007540000, 1),
    symbol: "EURUSD",
    side: "BUY",
    grade: "A_PLUS",
    engine_type: "INTRADAY",
    entry_price: "1.00050",
    invalidation_price: "0.99950",
    target_price: "1.00250",
    risk_reward_ratio: "2.00",
    expiry_candles: 3,
    generated_at: "2025-08-01T00:19:00.000Z",
    ...overrides,
  };
}

describe("EURUSD M1 Offline Replay Integrated Pipeline", () => {
  it("rejects immediately if candidate payload is invalid (fail-closed)", () => {
    const badCandidate = {
      ...createCandidateFixture(),
      entry_price: "invalid_number",
    };

    const result = runEurUsdM1ReplayPipeline({
      candidatePayload: badCandidate as unknown as StrategyCandidatePayload,
    });

    expect(result.status).toBe("CANDIDATE_REJECTED");
    expect(result.stoppedAtStage).toBe("CANDIDATE");
    expect(result.executionEligible).toBe(false);
    expect(result.orderIntentsCreated).toBe(0);
    expect(result.externalRequestsMade).toBe(0);
    expect(result.orderIntent).toBeNull();
  });

  it("rejects if no candidate input is provided", () => {
    const result = runEurUsdM1ReplayPipeline({});

    expect(result.status).toBe("CANDIDATE_REJECTED");
    expect(result.stoppedAtStage).toBe("CANDIDATE");
    expect(result.reasons).toContain("NO_CANDIDATE_INPUT_PROVIDED");
    expect(result.orderIntentsCreated).toBe(0);
  });

  it("executes the full pipeline in ANALYSIS_ONLY mode by default and completes safely", () => {
    const candidate = createCandidateFixture({ grade: "A_PLUS" });

    const result = runEurUsdM1ReplayPipeline({
      candidatePayload: candidate,
    });

    expect(result.candidate).not.toBeNull();
    expect(result.analystProposal).not.toBeNull();
    expect(result.criticProposal).not.toBeNull();
    expect(result.judgeInvoked).toBe(true); // Grade A+ triggers Judge
    expect(result.policyGateDecision?.approved).toBe(true);
    expect(result.riskDecision).not.toBeNull();
    expect(result.riskDecision?.reasons).toContain("ANALYSIS_ONLY");
    expect(result.status).toBe("ANALYSIS_COMPLETE");
    expect(result.stoppedAtStage).toBe("COMPLETE");
    expect(result.orderIntent).toBeNull();
    expect(result.orderIntentsCreated).toBe(0);
    expect(result.executionEligible).toBe(false);
    expect(result.externalRequestsMade).toBe(0);
  });

  it("rejects at PolicyGate if news blackout is active", () => {
    const candidate = createCandidateFixture({ grade: "A_PLUS" });

    const result = runEurUsdM1ReplayPipeline({
      candidatePayload: candidate,
      policyOverrides: {
        newsBlackout: true,
      },
    });

    expect(result.status).toBe("POLICY_REJECTED");
    expect(result.stoppedAtStage).toBe("POLICY");
    expect(result.policyGateDecision?.approved).toBe(false);
    expect(result.reasons).toContain("NEWS_BLACKOUT");
    expect(result.riskDecision).toBeNull();
    expect(result.orderIntent).toBeNull();
    expect(result.orderIntentsCreated).toBe(0);
  });

  it("rejects at PolicyGate if data health is not GREEN", () => {
    const candidate = createCandidateFixture({ grade: "A_PLUS" });

    const result = runEurUsdM1ReplayPipeline({
      candidatePayload: candidate,
      policyOverrides: {
        dataHealth: "STALE",
      },
    });

    expect(result.status).toBe("POLICY_REJECTED");
    expect(result.stoppedAtStage).toBe("POLICY");
    expect(result.policyGateDecision?.approved).toBe(false);
    expect(result.reasons).toContain("DATA_STALE");
    expect(result.orderIntentsCreated).toBe(0);
  });

  it("triggers bounded reanalysis requirement when material council divergence exists and budget remains", () => {
    const candidate = createCandidateFixture({ grade: "A_PLUS" });

    const result = runEurUsdM1ReplayPipeline({
      candidatePayload: candidate,
      criticProposalOverride: {
        verdict: "NEUTRAL",
        notes: "Divergence in higher timeframe structure",
      },
      reanalysisCount: 0,
      maxReanalyses: 1,
    });

    expect(result.status).toBe("JUDGE_REANALYSIS_REQUIRED");
    expect(result.stoppedAtStage).toBe("JUDGE");
    expect(result.judgeInvoked).toBe(true);
    expect(result.judgeDecision?.decision).toBe("REANALYZE");
    expect(result.policyGateDecision).toBeNull();
    expect(result.orderIntent).toBeNull();
    expect(result.orderIntentsCreated).toBe(0);
  });

  it("rejects at Judge when material council divergence persists after maximum reanalyses", () => {
    const candidate = createCandidateFixture({ grade: "A_PLUS" });

    const result = runEurUsdM1ReplayPipeline({
      candidatePayload: candidate,
      criticProposalOverride: {
        verdict: "NEUTRAL",
        notes: "Persistent divergence",
      },
      reanalysisCount: 1,
      maxReanalyses: 1,
    });

    expect(result.status).toBe("JUDGE_REJECTED");
    expect(result.stoppedAtStage).toBe("JUDGE");
    expect(result.judgeInvoked).toBe(true);
    expect(result.judgeDecision?.decision).toBe("REJECT");
    expect(result.policyGateDecision).toBeNull();
    expect(result.orderIntent).toBeNull();
    expect(result.orderIntentsCreated).toBe(0);
  });

  it("rejects at Risk stage if daily loss limit exceeded", () => {
    const candidate = createCandidateFixture({ grade: "A_PLUS" });

    const result = runEurUsdM1ReplayPipeline({
      candidatePayload: candidate,
      riskOverrides: {
        executionMode: "MANUAL_CONFIRM",
        dailyLossPercent: "1.60",
      },
    });

    expect(result.status).toBe("RISK_REJECTED");
    expect(result.stoppedAtStage).toBe("RISK");
    expect(result.riskDecision?.approved).toBe(false);
    expect(result.reasons).toContain("DAILY_LOSS_LIMIT");
    expect(result.orderIntent).toBeNull();
    expect(result.orderIntentsCreated).toBe(0);
  });

  it("forms an OrderIntent in a controlled test fixture with manual confirmation and all gates approved", () => {
    const candidate = createCandidateFixture({ grade: "A_PLUS" });

    const result = runEurUsdM1ReplayPipeline({
      candidatePayload: candidate,
      allowOrderIntentGeneration: true,
      riskOverrides: {
        executionMode: "MANUAL_CONFIRM",
        dailyLossPercent: "0.20",
        drawdownPercent: "0.50",
        currentOpenRiskPercent: "0.10",
        correlationOpenRiskPercent: "0.00",
        concurrentPositions: 1,
      },
    });

    expect(result.status).toBe("ORDER_INTENT_FORMED");
    expect(result.stoppedAtStage).toBe("ORDER_INTENT");
    expect(result.policyGateDecision?.approved).toBe(true);
    expect(result.riskDecision?.approved).toBe(true);
    expect(result.orderIntent).not.toBeNull();
    expect(result.orderIntentsCreated).toBe(1);
    expect(result.orderIntent?.candidate_id).toBe(candidate.candidate_id);
    expect(result.orderIntent?.symbol).toBe("EURUSD");
    expect(result.orderIntent?.side).toBe("BUY");
    expect(result.orderIntent?.limit_price).toBe("1.00050");
    expect(result.orderIntent?.stop_loss_price).toBe("0.99950");
    expect(result.orderIntent?.take_profit_price).toBe("1.00250");
    // Strictly preserve architectural safety invariants
    expect(result.executionEligible).toBe(false);
    expect(result.externalRequestsMade).toBe(0);
  });
});
