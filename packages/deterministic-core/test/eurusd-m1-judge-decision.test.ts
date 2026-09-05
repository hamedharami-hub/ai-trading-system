import { describe, it, expect } from "vitest";
import {
  type AnalystProposalPayload,
  type CriticProposalPayload,
  type StrategyCandidatePayload,
} from "@trade/contracts";
import { createDeterministicUuidV7 } from "../src/replay/eurusd-m1-strategy-candidate-evaluator.js";
import {
  evaluateEurUsdM1JudgeDecision,
  shouldInvokeEurUsdM1Judge,
} from "../src/replay/eurusd-m1-judge-decision.js";
import { evaluatePolicyGate } from "../src/policy/policy-gate.js";

function createCandidate(
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
    expiry_candles: 3,
    generated_at: "2025-08-01T00:19:00.000Z",
    ...overrides,
  };
}

function createAnalystProposal(
  candidateId: string,
  overrides?: Partial<AnalystProposalPayload>,
): AnalystProposalPayload {
  return {
    candidate_id: candidateId,
    verdict: "FAVORABLE",
    confidence: "0.8500",
    evidence_keys: [
      "BOS_CONFIRMED",
      "ATR_DISPLACEMENT_CONFIRMED",
      "ORDER_BLOCK_LEVEL_VALIDATED",
    ],
    notes: "Analyst confirms bullish structure and displacement.",
    evaluated_at: "2025-08-01T00:19:05.000Z",
    ...overrides,
  };
}

function createCriticProposal(
  candidateId: string,
  overrides?: Partial<CriticProposalPayload>,
): CriticProposalPayload {
  return {
    candidate_id: candidateId,
    verdict: "FAVORABLE",
    confidence: "0.8000",
    evidence_keys: ["RISK_REWARD_ACCEPTABLE", "SWEEP_VALIDATED"],
    notes: "Critic confirms 2.0 R:R and opposing liquidity sweep.",
    evaluated_at: "2025-08-01T00:19:06.000Z",
    ...overrides,
  };
}

describe("EurUsdM1JudgeDecision", () => {
  describe("shouldInvokeEurUsdM1Judge", () => {
    it("requires Judge invocation for Grade A_PLUS candidates even when proposals agree", () => {
      const candidate = createCandidate({ grade: "A_PLUS" });
      const analyst = createAnalystProposal(candidate.candidate_id);
      const critic = createCriticProposal(candidate.candidate_id);

      const check = shouldInvokeEurUsdM1Judge(candidate, analyst, critic);
      expect(check.invoked).toBe(true);
      expect(check.trigger).toBe("A_PLUS_CANDIDATE");
      expect(check.bothReject).toBe(false);
    });

    it("requires Judge invocation for material conflict on Grade A candidate", () => {
      const candidate = createCandidate({ grade: "A" });
      const analyst = createAnalystProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });
      const critic = createCriticProposal(candidate.candidate_id, {
        verdict: "NEUTRAL",
      });

      const check = shouldInvokeEurUsdM1Judge(candidate, analyst, critic);
      expect(check.invoked).toBe(true);
      expect(check.trigger).toBe("MATERIAL_CONFLICT");
      expect(check.materialConflict).toBe(true);
    });

    it("does not invoke Judge when both roles reject (unanimous rejection)", () => {
      const candidate = createCandidate({ grade: "A_PLUS" });
      const analyst = createAnalystProposal(candidate.candidate_id, {
        verdict: "UNFAVORABLE",
      });
      const critic = createCriticProposal(candidate.candidate_id, {
        verdict: "UNFAVORABLE",
      });

      const check = shouldInvokeEurUsdM1Judge(candidate, analyst, critic);
      expect(check.invoked).toBe(false);
      expect(check.trigger).toBe("NOT_TRIGGERED");
      expect(check.bothReject).toBe(true);
    });

    it("does not invoke Judge for Grade A candidate with unanimous FAVORABLE concurrence", () => {
      const candidate = createCandidate({ grade: "A" });
      const analyst = createAnalystProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });
      const critic = createCriticProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });

      const check = shouldInvokeEurUsdM1Judge(candidate, analyst, critic);
      expect(check.invoked).toBe(false);
      expect(check.trigger).toBe("NOT_TRIGGERED");
    });
  });

  describe("evaluateEurUsdM1JudgeDecision", () => {
    it("returns JUDGE_NOT_INVOKED when conditions do not warrant Judge and allowUnconditional is false", () => {
      const candidate = createCandidate({ grade: "A" });
      const analyst = createAnalystProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });
      const critic = createCriticProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });

      const res = evaluateEurUsdM1JudgeDecision({
        candidate,
        analystProposal: analyst,
        criticProposal: critic,
      });

      expect(res.kind).toBe("JUDGE_NOT_INVOKED");
      expect(res.decisionPayload).toBeNull();
      expect(res.executionEligible).toBe(false);
      expect(res.orderIntentsCreated).toBe(0);
    });

    it("fails closed on candidate_id mismatch across proposals", () => {
      const candidate = createCandidate();
      const analyst = createAnalystProposal(candidate.candidate_id);
      const mismatchedCritic = createCriticProposal(
        createDeterministicUuidV7(1754007540000, 99),
      );

      const res = evaluateEurUsdM1JudgeDecision({
        candidate,
        analystProposal: analyst,
        criticProposal: mismatchedCritic,
      });

      expect(res.kind).toBe("JUDGE_REJECTED");
      expect(res.reason).toBe("CANDIDATE_ID_MISMATCH");
      expect(res.decisionPayload).toBeNull();
    });

    it("fails closed on invalid reanalysis count", () => {
      const candidate = createCandidate();
      const analyst = createAnalystProposal(candidate.candidate_id);
      const critic = createCriticProposal(candidate.candidate_id);

      const res = evaluateEurUsdM1JudgeDecision({
        candidate,
        analystProposal: analyst,
        criticProposal: critic,
        reanalysisCount: -1,
      });

      expect(res.kind).toBe("JUDGE_REJECTED");
      expect(res.reason).toBe("INVALID_REANALYSIS_COUNT");
    });

    it("evaluates APPROVE for Grade A_PLUS candidate with council concurrence", () => {
      const candidate = createCandidate({ grade: "A_PLUS" });
      const analyst = createAnalystProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });
      const critic = createCriticProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });

      const res = evaluateEurUsdM1JudgeDecision({
        candidate,
        analystProposal: analyst,
        criticProposal: critic,
      });

      expect(res.kind).toBe("JUDGE_DECISION_EVALUATED");
      expect(res.trigger).toBe("A_PLUS_CANDIDATE");
      expect(res.decisionPayload).not.toBeNull();
      expect(res.decisionPayload?.decision).toBe("APPROVE");
      expect(res.decisionPayload?.candidate_id).toBe(candidate.candidate_id);
      expect(res.decisionPayload?.reanalysis_count).toBe(0);
      expect(res.executionEligible).toBe(false);
      expect(res.orderIntentsCreated).toBe(0);
      expect(res.externalRequestsMade).toBe(0);

      // Verify PolicyGate integration
      const policyRes = evaluatePolicyGate({
        dataHealth: "GREEN",
        sessionPermitted: true,
        newsBlackout: false,
        candidateValid: true,
        candidateExpired: false,
        analyticalConflict: false,
        judgeRequired: true,
        judgeDecision: res.decisionPayload?.decision,
      });
      expect(policyRes.approved).toBe(true);
    });

    it("evaluates REANALYZE on initial material divergence (FAVORABLE vs NEUTRAL)", () => {
      const candidate = createCandidate({ grade: "A" });
      const analyst = createAnalystProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });
      const critic = createCriticProposal(candidate.candidate_id, {
        verdict: "NEUTRAL",
      });

      const res = evaluateEurUsdM1JudgeDecision({
        candidate,
        analystProposal: analyst,
        criticProposal: critic,
        reanalysisCount: 0,
        maxReanalyses: 1,
      });

      expect(res.kind).toBe("JUDGE_DECISION_EVALUATED");
      expect(res.trigger).toBe("MATERIAL_CONFLICT");
      expect(res.decisionPayload?.decision).toBe("REANALYZE");
      expect(res.decisionPayload?.reanalysis_count).toBe(0);

      // Verify PolicyGate integration on REANALYZE
      const policyRes = evaluatePolicyGate({
        dataHealth: "GREEN",
        sessionPermitted: true,
        newsBlackout: false,
        candidateValid: true,
        candidateExpired: false,
        analyticalConflict: true,
        judgeRequired: true,
        judgeDecision: res.decisionPayload?.decision,
      });
      expect(policyRes.approved).toBe(false);
      expect(policyRes.reasons).toContain("REANALYSIS_REQUIRED");
    });

    it("evaluates REJECT when material divergence persists beyond bounded reanalyses", () => {
      const candidate = createCandidate({ grade: "A" });
      const analyst = createAnalystProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });
      const critic = createCriticProposal(candidate.candidate_id, {
        verdict: "NEUTRAL",
      });

      // Already reanalyzed once (reanalysisCount: 1, with maxReanalyses: 1)
      const res = evaluateEurUsdM1JudgeDecision({
        candidate,
        analystProposal: analyst,
        criticProposal: critic,
        reanalysisCount: 1,
        maxReanalyses: 1,
      });

      expect(res.kind).toBe("JUDGE_DECISION_EVALUATED");
      expect(res.decisionPayload?.decision).toBe("REJECT");
      expect(res.decisionPayload?.reason).toContain(
        "maximum allowed reanalyses",
      );
      expect(res.decisionPayload?.reanalysis_count).toBe(1);

      // Verify PolicyGate integration on REJECT
      const policyRes = evaluatePolicyGate({
        dataHealth: "GREEN",
        sessionPermitted: true,
        newsBlackout: false,
        candidateValid: true,
        candidateExpired: false,
        analyticalConflict: true,
        judgeRequired: true,
        judgeDecision: res.decisionPayload?.decision,
      });
      expect(policyRes.approved).toBe(false);
      expect(policyRes.reasons).toContain("ANALYTICAL_APPROVAL_MISSING");
    });

    it("evaluates REJECT when Critic is UNFAVORABLE", () => {
      const candidate = createCandidate({ grade: "A_PLUS" });
      const analyst = createAnalystProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });
      const critic = createCriticProposal(candidate.candidate_id, {
        verdict: "UNFAVORABLE",
      });

      const res = evaluateEurUsdM1JudgeDecision({
        candidate,
        analystProposal: analyst,
        criticProposal: critic,
      });

      expect(res.kind).toBe("JUDGE_DECISION_EVALUATED");
      expect(res.decisionPayload?.decision).toBe("REJECT");
      expect(res.decisionPayload?.reason).toContain(
        "Critic proposal is UNFAVORABLE",
      );
    });

    it("evaluates REJECT when Analyst is UNFAVORABLE", () => {
      const candidate = createCandidate({ grade: "A_PLUS" });
      const analyst = createAnalystProposal(candidate.candidate_id, {
        verdict: "UNFAVORABLE",
      });
      const critic = createCriticProposal(candidate.candidate_id, {
        verdict: "FAVORABLE",
      });

      const res = evaluateEurUsdM1JudgeDecision({
        candidate,
        analystProposal: analyst,
        criticProposal: critic,
      });

      expect(res.kind).toBe("JUDGE_DECISION_EVALUATED");
      expect(res.decisionPayload?.decision).toBe("REJECT");
      expect(res.decisionPayload?.reason).toContain(
        "Analyst proposal is UNFAVORABLE",
      );
    });
  });
});
