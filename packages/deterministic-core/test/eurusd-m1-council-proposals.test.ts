import { describe, it, expect } from "vitest";
import {
  type StrategyCandidatePayload,
  validatePayload,
} from "@trade/contracts";
import {
  evaluateEurUsdM1AnalystProposal,
  evaluateEurUsdM1CriticProposal,
  evaluateEurUsdM1CouncilProposals,
} from "../src/replay/eurusd-m1-council-proposals.js";
import { createDeterministicUuidV7 } from "../src/replay/eurusd-m1-strategy-candidate-evaluator.js";

function createValidCandidate(
  overrides?: Partial<StrategyCandidatePayload>,
): StrategyCandidatePayload {
  return {
    candidate_id: createDeterministicUuidV7(1754007540000, 1),
    symbol: "EURUSD",
    side: "BUY",
    grade: "A",
    engine_type: "INTRADAY",
    entry_price: "1.00050",
    invalidation_price: "0.99950",
    target_price: "1.00250",
    risk_reward_ratio: "2.000",
    expiry_candles: 3,
    generated_at: "2025-08-01T00:19:00.000Z",
    ...overrides,
  };
}

describe("EURUSD M1 Council Proposals Evaluator", () => {
  describe("Analyst Proposal", () => {
    it("fails closed when candidate is missing or invalid", () => {
      // @ts-expect-error Testing invalid input
      const result = evaluateEurUsdM1AnalystProposal({ candidate: null });
      expect(result).toMatchObject({
        kind: "PROPOSAL_REJECTED",
        status: "INVALID_CANDIDATE",
        proposal: null,
        executionEligible: false,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    });

    it("evaluates a Grade A candidate as FAVORABLE with 0.7500 confidence", () => {
      const candidate = createValidCandidate({ grade: "A" });
      const result = evaluateEurUsdM1AnalystProposal({ candidate });

      expect(result.kind).toBe("ANALYST_PROPOSAL_EVALUATED");
      expect(result.status).toBe("PROPOSAL_EVALUATED");
      expect(result.proposal).toBeDefined();
      expect(result.proposal?.candidate_id).toBe(candidate.candidate_id);
      expect(result.proposal?.verdict).toBe("FAVORABLE");
      expect(result.proposal?.confidence).toBe("0.7500");
      expect(result.proposal?.evidence_keys).toContain(
        "STRUCTURE_BREAK_CONFIRMED",
      );
      expect(result.proposal?.evidence_keys).toContain(
        "DISPLACEMENT_VALIDATED",
      );
      expect(result.proposal?.evidence_keys).toContain("ZONE_ESTABLISHED");
      expect(result.executionEligible).toBe(false);

      const validation = validatePayload("ANALYST_PROPOSAL", result.proposal!);
      expect(validation.valid).toBe(true);
    });

    it("evaluates a Grade A_PLUS candidate as FAVORABLE with 0.8500 confidence", () => {
      const candidate = createValidCandidate({ grade: "A_PLUS" });
      const result = evaluateEurUsdM1AnalystProposal({ candidate });

      expect(result.kind).toBe("ANALYST_PROPOSAL_EVALUATED");
      expect(result.proposal?.verdict).toBe("FAVORABLE");
      expect(result.proposal?.confidence).toBe("0.8500");
      expect(result.proposal?.evidence_keys).toContain(
        "LIQUIDITY_SWEEP_CONFIRMED",
      );

      const validation = validatePayload("ANALYST_PROPOSAL", result.proposal!);
      expect(validation.valid).toBe(true);
    });

    it("evaluates a Grade B candidate as NEUTRAL with 0.5000 confidence", () => {
      const candidate = createValidCandidate({ grade: "B" });
      const result = evaluateEurUsdM1AnalystProposal({ candidate });

      expect(result.kind).toBe("ANALYST_PROPOSAL_EVALUATED");
      expect(result.proposal?.verdict).toBe("NEUTRAL");
      expect(result.proposal?.confidence).toBe("0.5000");

      const validation = validatePayload("ANALYST_PROPOSAL", result.proposal!);
      expect(validation.valid).toBe(true);
    });
  });

  describe("Critic Proposal", () => {
    it("fails closed when candidate is missing or invalid", () => {
      // @ts-expect-error Testing invalid input
      const result = evaluateEurUsdM1CriticProposal({ candidate: null });
      expect(result).toMatchObject({
        kind: "PROPOSAL_REJECTED",
        status: "INVALID_CANDIDATE",
        proposal: null,
        executionEligible: false,
        orderIntentsCreated: 0,
        externalRequestsMade: 0,
      });
    });

    it("evaluates a Grade A candidate as NEUTRAL due to unconfirmed sweep", () => {
      const candidate = createValidCandidate({ grade: "A" });
      const result = evaluateEurUsdM1CriticProposal({ candidate });

      expect(result.kind).toBe("CRITIC_PROPOSAL_EVALUATED");
      expect(result.proposal?.verdict).toBe("NEUTRAL");
      expect(result.proposal?.confidence).toBe("0.6500");
      expect(result.proposal?.evidence_keys).toContain(
        "UNCONFIRMED_LIQUIDITY_SWEEP",
      );
      expect(result.executionEligible).toBe(false);

      const validation = validatePayload("CRITIC_PROPOSAL", result.proposal!);
      expect(validation.valid).toBe(true);
    });

    it("evaluates a Grade A_PLUS candidate as FAVORABLE with 0.8000 confidence", () => {
      const candidate = createValidCandidate({ grade: "A_PLUS" });
      const result = evaluateEurUsdM1CriticProposal({ candidate });

      expect(result.kind).toBe("CRITIC_PROPOSAL_EVALUATED");
      expect(result.proposal?.verdict).toBe("FAVORABLE");
      expect(result.proposal?.confidence).toBe("0.8000");
      expect(result.proposal?.evidence_keys).toContain("SWEEP_VALIDATED");

      const validation = validatePayload("CRITIC_PROPOSAL", result.proposal!);
      expect(validation.valid).toBe(true);
    });

    it("returns UNFAVORABLE when Risk:Reward is strictly below 2.0", () => {
      const candidate = createValidCandidate({ risk_reward_ratio: "1.500" });
      const result = evaluateEurUsdM1CriticProposal({ candidate });

      expect(result.kind).toBe("CRITIC_PROPOSAL_EVALUATED");
      expect(result.proposal?.verdict).toBe("UNFAVORABLE");
      expect(result.proposal?.confidence).toBe("0.9000");
      expect(result.proposal?.evidence_keys).toContain(
        "INSUFFICIENT_RISK_REWARD",
      );

      const validation = validatePayload("CRITIC_PROPOSAL", result.proposal!);
      expect(validation.valid).toBe(true);
    });

    it("returns UNFAVORABLE when expiry candles exceeds 3", () => {
      const candidate = createValidCandidate({ expiry_candles: 5 });
      const result = evaluateEurUsdM1CriticProposal({ candidate });

      expect(result.kind).toBe("CRITIC_PROPOSAL_EVALUATED");
      expect(result.proposal?.verdict).toBe("UNFAVORABLE");
      expect(result.proposal?.confidence).toBe("0.8500");
      expect(result.proposal?.evidence_keys).toContain(
        "EXCESSIVE_EXPIRY_HORIZON",
      );

      const validation = validatePayload("CRITIC_PROPOSAL", result.proposal!);
      expect(validation.valid).toBe(true);
    });
  });

  describe("Combined Council Proposals", () => {
    it("evaluates both Analyst and Critic proposals together with zero execution eligibility", () => {
      const candidate = createValidCandidate({ grade: "A_PLUS" });
      const council = evaluateEurUsdM1CouncilProposals({ candidate });

      expect(council.kind).toBe("COUNCIL_EVALUATED");
      expect(council.analyst.kind).toBe("ANALYST_PROPOSAL_EVALUATED");
      expect(council.critic.kind).toBe("CRITIC_PROPOSAL_EVALUATED");
      expect(council.executionEligible).toBe(false);
      expect(council.orderIntentsCreated).toBe(0);
      expect(council.externalRequestsMade).toBe(0);

      expect(council.analyst.proposal?.verdict).toBe("FAVORABLE");
      expect(council.critic.proposal?.verdict).toBe("FAVORABLE");
    });
  });
});
